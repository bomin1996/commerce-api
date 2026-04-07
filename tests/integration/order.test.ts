import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/config/database';
import redis from '../../src/config/redis';
import { initDatabase } from '../../src/config/database';

let productId: number;

beforeAll(async () => {
  await initDatabase();
  await pool.query('DELETE FROM payments');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM products');
  await redis.flushdb();

  // 테스트용 상품 생성
  const res = await request(app)
    .post('/api/products')
    .send({ name: '테스트 신발', price: 100000, stock: 10 });
  productId = res.body.id;
});

afterAll(async () => {
  await pool.end();
  await redis.quit();
});

describe('POST /api/orders', () => {
  it('주문을 생성하고 재고가 차감된다', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ productId, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.quantity).toBe(2);

    // 재고 확인
    const product = await request(app).get(`/api/products/${productId}`);
    expect(product.body.stock).toBe(8);
  });

  it('재고보다 많이 주문하면 409를 반환한다', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ productId, quantity: 999 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Insufficient stock');
  });

  it('존재하지 않는 상품은 404를 반환한다', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ productId: 999999, quantity: 1 });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/orders/:orderNumber', () => {
  let orderNumber: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ productId, quantity: 1 });
    orderNumber = res.body.order_number;
  });

  it('주문을 조회한다', async () => {
    const res = await request(app).get(`/api/orders/${orderNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.order_number).toBe(orderNumber);
  });

  it('존재하지 않는 주문은 404를 반환한다', async () => {
    const res = await request(app).get('/api/orders/non-existent-order');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders/:orderNumber/cancel', () => {
  let orderNumber: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ productId, quantity: 1 });
    orderNumber = res.body.order_number;
  });

  it('주문을 취소하고 재고가 복구된다', async () => {
    const beforeProduct = await request(app).get(`/api/products/${productId}`);
    const stockBefore = beforeProduct.body.stock;

    const res = await request(app)
      .post(`/api/orders/${orderNumber}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');

    // 재고 복구 확인
    await redis.del(`product:${productId}`);
    const afterProduct = await request(app).get(`/api/products/${productId}`);
    expect(afterProduct.body.stock).toBe(stockBefore + 1);
  });

  it('이미 취소된 주문은 404를 반환한다', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderNumber}/cancel`);

    expect(res.status).toBe(404);
  });
});
