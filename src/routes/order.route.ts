import { Router } from 'express';
import { create, getByNumber, cancel } from '../controllers/order.controller';
import { validate, orderCreateRules } from '../middleware/validate';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: 주문 생성
 *     tags: [Orders]
 *     description: 상품 재고를 낙관적 락으로 차감하고 주문을 생성합니다
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: 주문 생성 성공
 *       404:
 *         description: 상품 없음
 *       409:
 *         description: 재고 부족 또는 동시성 충돌
 */
router.post('/api/orders', validate(orderCreateRules), create);

/**
 * @swagger
 * /api/orders/{orderNumber}:
 *   get:
 *     summary: 주문 조회
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 주문 정보
 *       404:
 *         description: 주문 없음
 */
router.get('/api/orders/:orderNumber', getByNumber);

/**
 * @swagger
 * /api/orders/{orderNumber}/cancel:
 *   post:
 *     summary: 주문 취소
 *     tags: [Orders]
 *     description: PENDING 상태의 주문을 취소하고 재고를 복구합니다
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 취소 성공
 *       404:
 *         description: 주문 없음 또는 취소 불가
 */
router.post('/api/orders/:orderNumber/cancel', cancel);

export default router;
