import { Router } from 'express';
import { pay } from '../controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: 결제 처리
 *     tags: [Payments]
 *     description: |
 *       멱등성(Idempotency) 보장 - 같은 idempotencyKey로 여러 번 요청해도 결제는 1번만 처리됩니다.
 *       네트워크 오류 시 안전하게 재시도할 수 있습니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderNumber, idempotencyKey]
 *             properties:
 *               orderNumber:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               idempotencyKey:
 *                 type: string
 *                 example: "pay-550e8400-001"
 *     responses:
 *       201:
 *         description: 결제 성공 (또는 이미 처리된 결제 반환)
 *       404:
 *         description: 주문 없음
 *       409:
 *         description: 결제 불가 상태 (이미 결제/취소됨)
 */
router.post('/api/payments', pay);

export default router;
