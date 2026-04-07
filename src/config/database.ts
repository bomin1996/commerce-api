import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'commerce',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
});

export async function initDatabase(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        version INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(36) NOT NULL UNIQUE,
        product_id BIGINT NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(12, 2) NOT NULL,
        status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_number (order_number),
        INDEX idx_status (status)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        idempotency_key VARCHAR(36) NOT NULL UNIQUE,
        amount DECIMAL(12, 2) NOT NULL,
        status ENUM('SUCCESS', 'FAILED') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_idempotency_key (idempotency_key)
      )
    `);

    console.log('Database initialized');
  } finally {
    connection.release();
  }
}

export default pool;
