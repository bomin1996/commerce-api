import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/config/database';
import redis from '../../src/config/redis';
import { initDatabase } from '../../src/config/database';

beforeAll(async () => {
  await initDatabase();
  await pool.query('DELETE FROM payments');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM products');
  await redis.flushdb();
});

afterAll(async () => {
  await pool.end();
  await redis.quit();
});

describe('POST /api/products', () => {
  it('상품을 등록한다', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: '나이키 에어맥스 90', price: 139000, stock: 100 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('나이키 에어맥스 90');
    expect(res.body.price).toBe(139000);
    expect(res.body.stock).toBe(100);
  });

  it('필수 필드 없이 요청하면 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: '테스트' });

    expect(res.status).toBe(400);
  });

  it('음수 가격은 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: '테스트', price: -1000, stock: 10 });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/products', () => {
  it('상품 목록을 반환한다', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
  });
});

describe('GET /api/products/:id', () => {
  let productId: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: '아디다스 울트라부스트', price: 199000, stock: 50 });
    productId = res.body.id;
  });

  it('상품을 조회한다', async () => {
    const res = await request(app).get(`/api/products/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('아디다스 울트라부스트');
  });

  it('존재하지 않는 상품은 404를 반환한다', async () => {
    const res = await request(app).get('/api/products/999999');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/products/:id', () => {
  let productId: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: '수정 테스트', price: 50000, stock: 30 });
    productId = res.body.id;
  });

  it('상품 가격을 수정한다', async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .send({ price: 45000 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(45000);
  });
});

describe('DELETE /api/products/:id', () => {
  let productId: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: '삭제 테스트', price: 10000, stock: 5 });
    productId = res.body.id;
  });

  it('상품을 삭제한다', async () => {
    const res = await request(app).delete(`/api/products/${productId}`);
    expect(res.status).toBe(204);
  });

  it('삭제된 상품은 404를 반환한다', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(404);
  });
});
