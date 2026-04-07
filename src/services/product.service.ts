import pool from '../config/database';
import redis from '../config/redis';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const CACHE_TTL = 300; // 5분

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  version: number;
  created_at: Date;
  updated_at: Date;
}

interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export async function createProduct(dto: CreateProductDto): Promise<ProductRow> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
    [dto.name, dto.description || null, dto.price, dto.stock]
  );

  return getProductById(result.insertId) as Promise<ProductRow>;
}

export async function getProductById(id: number): Promise<ProductRow | null> {
  // 캐시 확인
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  const [rows] = await pool.query<ProductRow[]>(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );

  if (rows.length === 0) return null;

  await redis.set(`product:${id}`, JSON.stringify(rows[0]), 'EX', CACHE_TTL);
  return rows[0];
}

export async function getProducts(page: number = 1, limit: number = 20): Promise<{ products: ProductRow[]; total: number }> {
  const offset = (page - 1) * limit;

  const [[countResult], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM products'),
    pool.query<ProductRow[]>('SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
  ]);

  return {
    products: rows,
    total: (countResult[0] as any).total,
  };
}

export async function updateProduct(id: number, dto: Partial<CreateProductDto>): Promise<ProductRow | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
  if (dto.description !== undefined) { fields.push('description = ?'); values.push(dto.description); }
  if (dto.price !== undefined) { fields.push('price = ?'); values.push(dto.price); }
  if (dto.stock !== undefined) { fields.push('stock = ?'); values.push(dto.stock); }

  if (fields.length === 0) return getProductById(id);

  values.push(id);
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);

  // 캐시 무효화
  await redis.del(`product:${id}`);

  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM products WHERE id = ?',
    [id]
  );

  await redis.del(`product:${id}`);
  return result.affectedRows > 0;
}
