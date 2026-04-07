import app from './app';
import { initDatabase } from './config/database';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Commerce API running on http://localhost:${PORT}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  });
}

start().catch(console.error);
