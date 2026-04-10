import { Router, Request, Response } from 'express';
import pool from '../config/database';
import redis from '../config/redis';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 헬스 체크
 *     tags: [Health]
 *     description: API 서버, MySQL, Redis 상태를 확인합니다
 *     responses:
 *       200:
 *         description: 모든 서비스 정상
 *       503:
 *         description: 일부 서비스 장애
 */
router.get('/api/health', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = { api: 'ok' };
  let healthy = true;

  try {
    await pool.query('SELECT 1');
    checks.mysql = 'ok';
  } catch {
    checks.mysql = 'error';
    healthy = false;
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
    healthy = false;
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
