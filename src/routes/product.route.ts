import { Router } from 'express';
import { create, getById, getAll, update, remove } from '../controllers/product.controller';

const router = Router();

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: 상품 등록
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "나이키 에어맥스 90"
 *               description:
 *                 type: string
 *                 example: "클래식 러닝화"
 *               price:
 *                 type: number
 *                 example: 139000
 *               stock:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       201:
 *         description: 상품 등록 성공
 *       400:
 *         description: 잘못된 요청
 */
router.post('/api/products', create);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: 상품 목록 조회
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 상품 목록
 */
router.get('/api/products', getAll);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: 상품 상세 조회
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 상품 정보
 *       404:
 *         description: 상품 없음
 */
router.get('/api/products/:id', getById);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: 상품 수정
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 수정 성공
 *       404:
 *         description: 상품 없음
 */
router.patch('/api/products/:id', update);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: 상품 삭제
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: 삭제 성공
 *       404:
 *         description: 상품 없음
 */
router.delete('/api/products/:id', remove);

export default router;
