import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/config/database';
import redis from '../../src/config/redis';
import { initDatabase } from '../../src/config/database';
import { v4 as uuidv4 } from 'uuid';

let productId: number;
let orderNumber: string;

beforeAll(async () => {
  await initDatabase();
  await pool.query('DELETE FROM payments');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM products');
  await redis.flushdb();

  // 테스트용 상품 + 주문 생성
  const productRes = await request(app)
    .post('/api/products')
    .send({ name: '결제 테스트 상품', price: 50000, stock: 10 });
  productId = productRes.body.id;

  const orderRes = await request(app)
    .post('/api/orders')
    .send({ productId, quantity: 1 });
  orderNumber = orderRes.body.order_number;
});

afterAll(async () => {
  await pool.end();
  await redis.quit();
});

describe('POST /api/payments', () => {
  it('결제를 처리한다', async () => {
    const idempotencyKey = uuidv4();

    const res = await request(app)
      .post('/api/payments')
      .send({ orderNumber, idempotencyKey });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('SUCCESS');
    expect(res.body.amount).toBe(50000);

    // 주문 상태 확인
    const order = await request(app).get(`/api/orders/${orderNumber}`);
    expect(order.body.status).toBe('PAID');
  });

  it('같은 idempotencyKey로 재요청하면 같은 결과를 반환한다 (멱등성)', async () => {
    // 새 주문 생성
    const orderRes = await request(app)
      .post('/api/orders')
      .send({ productId, quantity: 1 });
    const newOrderNumber = orderRes.body.order_number;
    const idempotencyKey = uuidv4();

    // 첫 번째 요청
    const res1 = await request(app)
      .post('/api/payments')
      .send({ orderNumber: newOrderNumber, idempotencyKey });

    // 두 번째 요청 (같은 key)
    const res2 = await request(app)
      .post('/api/payments')
      .send({ orderNumber: newOrderNumber, idempotencyKey });

    expect(res1.body.id).toBe(res2.body.id);
    expect(res1.body.amount).toBe(res2.body.amount);
  });

  it('이미 결제된 주문은 409를 반환한다', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ orderNumber, idempotencyKey: uuidv4() });

    expect(res.status).toBe(409);
  });

  it('존재하지 않는 주문은 404를 반환한다', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ orderNumber: 'fake-order', idempotencyKey: uuidv4() });

    expect(res.status).toBe(404);
  });

  it('필수 필드 없으면 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ orderNumber: 'test' });

    expect(res.status).toBe(400);
  });
});
