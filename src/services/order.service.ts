import pool from '../config/database';
import redis from '../config/redis';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface OrderRow extends RowDataPacket {
  id: number;
  order_number: string;
  product_id: number;
  quantity: number;
  total_price: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface ProductRow extends RowDataPacket {
  id: number;
  price: number;
  stock: number;
  version: number;
}

/**
 * 주문 생성 - 낙관적 락(Optimistic Lock)으로 재고 동시성 제어
 *
 * 왜 낙관적 락인가?
 * - 비관적 락(SELECT FOR UPDATE)은 DB 행을 잠가서 동시 요청 시 대기 발생
 * - 낙관적 락은 version 컬럼으로 충돌 감지 → 충돌 시 재시도
 * - 읽기 > 쓰기인 커머스 특성상 낙관적 락이 처리량 면에서 유리
 */
export async function createOrder(productId: number, quantity: number): Promise<OrderRow> {
  const MAX_RETRY = 3;

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. 상품 조회 (현재 version 확인)
      const [products] = await connection.query<ProductRow[]>(
        'SELECT id, price, stock, version FROM products WHERE id = ?',
        [productId]
      );

      if (products.length === 0) {
        await connection.rollback();
        throw new Error('PRODUCT_NOT_FOUND');
      }

      const product = products[0];

      if (product.stock < quantity) {
        await connection.rollback();
        throw new Error('INSUFFICIENT_STOCK');
      }

      // 2. 낙관적 락으로 재고 차감 (version이 변경되지 않았을 때만 성공)
      const [updateResult] = await connection.query<ResultSetHeader>(
        'UPDATE products SET stock = stock - ?, version = version + 1 WHERE id = ? AND version = ?',
        [quantity, productId, product.version]
      );

      // version이 변경된 경우 (다른 요청이 먼저 처리됨) → 재시도
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        continue;
      }

      // 3. 주문 생성
      const orderNumber = uuidv4();
      const totalPrice = product.price * quantity;

      const [orderResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO orders (order_number, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)',
        [orderNumber, productId, quantity, totalPrice, 'PENDING']
      );

      await connection.commit();

      // 상품 캐시 무효화
      await redis.del(`product:${productId}`);

      const [orders] = await pool.query<OrderRow[]>(
        'SELECT * FROM orders WHERE id = ?',
        [orderResult.insertId]
      );

      return orders[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  throw new Error('CONCURRENT_UPDATE_FAILED');
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderRow | null> {
  const [rows] = await pool.query<OrderRow[]>(
    'SELECT * FROM orders WHERE order_number = ?',
    [orderNumber]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function cancelOrder(orderNumber: string): Promise<OrderRow | null> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query<OrderRow[]>(
      'SELECT * FROM orders WHERE order_number = ? AND status = ?',
      [orderNumber, 'PENDING']
    );

    if (orders.length === 0) {
      await connection.rollback();
      return null;
    }

    const order = orders[0];

    // 주문 취소
    await connection.query(
      'UPDATE orders SET status = ? WHERE order_number = ?',
      ['CANCELLED', orderNumber]
    );

    // 재고 복구
    await connection.query(
      'UPDATE products SET stock = stock + ? WHERE id = ?',
      [order.quantity, order.product_id]
    );

    await connection.commit();

    await redis.del(`product:${order.product_id}`);

    const [updated] = await pool.query<OrderRow[]>(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    return updated[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
