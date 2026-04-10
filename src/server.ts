import app from './app';
import { initDatabase } from './config/database';
import { logger } from './config/logger';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    logger.info(`Commerce API running on http://localhost:${PORT}`);
    logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
