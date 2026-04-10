import { Request, Response } from 'express';
import { createProduct, getProductById, getProducts, updateProduct, deleteProduct } from '../services/product.service';
import { NotFoundError } from '../errors/AppError';

export async function create(req: Request, res: Response): Promise<void> {
  const { name, description, price, stock } = req.body;
  const product = await createProduct({ name, description, price, stock });
  res.status(201).json(product);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const product = await getProductById(id);

  if (!product) throw new NotFoundError('Product not found');

  res.json(product);
}

export async function getAll(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const keyword = req.query.keyword as string | undefined;
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

  const result = await getProducts({ page, limit, keyword, minPrice, maxPrice });
  res.json({
    ...result,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const product = await updateProduct(id, req.body);

  if (!product) throw new NotFoundError('Product not found');

  res.json(product);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const deleted = await deleteProduct(id);

  if (!deleted) throw new NotFoundError('Product not found');

  res.status(204).send();
}
