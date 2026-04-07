import { Request, Response } from 'express';
import { createProduct, getProductById, getProducts, updateProduct, deleteProduct } from '../services/product.service';

export async function create(req: Request, res: Response): Promise<void> {
  const { name, description, price, stock } = req.body;

  if (!name || price === undefined || stock === undefined) {
    res.status(400).json({ error: 'name, price, stock are required' });
    return;
  }

  if (price < 0 || stock < 0) {
    res.status(400).json({ error: 'price and stock must be non-negative' });
    return;
  }

  try {
    const product = await createProduct({ name, description, price, stock });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  try {
    const product = await getProductById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product' });
  }
}

export async function getAll(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  try {
    const result = await getProducts(page, limit);
    res.json({
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get products' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  try {
    const product = await updateProduct(id, req.body);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  try {
    const deleted = await deleteProduct(id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
}
