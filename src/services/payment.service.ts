import pool from '../config/database';
import redis from '../config/redis';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { NotFoundError, ConflictError } from '../errors/AppError';

interface PaymentRow extends RowDataPacket {
  id: number;
  order_id: number;
  idempotency_key: string;
  amount: number;
  status: string;
  created_at: Date;
}

interface OrderRow extends RowDataPacket {
  id: number;
  order_number: string;
  total_price: number;
  status: string;
}

/**
 * 결제 처리 - 멱등성(Idempotency) 보장
 *
 * 같은 idempotency_key로 여러 번 요청해도 결제는 1번만 처리됨.
 * 네트워크 오류로 클라이언트가 결과를 못 받았을 때 안전하게 재시도 가능.
 *
 * 흐름:
 * 1. idempotency_key로 기존 결제 조회 → 있으면 기존 결과 반환
 * 2. Redis 분산 락으로 동시 요청 방지
 * 3. 주문 상태 확인 → 결제 처리 → 주문 상태 변경
 */
export async function processPayment(orderNumber: string, idempotencyKey: string): Promise<PaymentRow> {
  // 1. 이미 처리된 결제인지 확인 (멱등성)
  const [existing] = await pool.query<PaymentRow[]>(
    'SELECT * FROM payments WHERE idempotency_key = ?',
    [idempotencyKey]
  );

  if (existing.length > 0) {
    return existing[0]; // 같은 key로 이미 처리됨 → 기존 결과 반환
  }

  // 2. 분산 락 획득 (동일 key 동시 요청 방지)
  const lockKey = `lock:payment:${idempotencyKey}`;
  const locked = await redis.set(lockKey, '1', 'EX', 30, 'NX');

  if (!locked) {
    throw new ConflictError('Payment is already being processed', 'PAYMENT_IN_PROGRESS');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 3. 주문 조회
    const [orders] = await connection.query<OrderRow[]>(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (orders.length === 0) {
      await connection.rollback();
      throw new NotFoundError('Order not found');
    }

    const order = orders[0];

    if (order.status !== 'PENDING') {
      await connection.rollback();
      throw new ConflictError('Order is not payable (already paid or cancelled)', 'ORDER_NOT_PAYABLE');
    }

    // 4. 결제 기록 생성
    const [paymentResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO payments (order_id, idempotency_key, amount, status) VALUES (?, ?, ?, ?)',
      [order.id, idempotencyKey, order.total_price, 'SUCCESS']
    );

    // 5. 주문 상태 변경
    await connection.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['PAID', order.id]
    );

    await connection.commit();

    const [payments] = await pool.query<PaymentRow[]>(
      'SELECT * FROM payments WHERE id = ?',
      [paymentResult.insertId]
    );

    return payments[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await redis.del(lockKey);
  }
}

export async function getPaymentByKey(idempotencyKey: string): Promise<PaymentRow | null> {
  const [rows] = await pool.query<PaymentRow[]>(
    'SELECT * FROM payments WHERE idempotency_key = ?',
    [idempotencyKey]
  );

  return rows.length > 0 ? rows[0] : null;
}
