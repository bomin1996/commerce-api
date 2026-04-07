import { Request, Response } from 'express';
import { createOrder, getOrderByNumber, cancelOrder } from '../services/order.service';

export async function create(req: Request, res: Response): Promise<void> {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    res.status(400).json({ error: 'productId and quantity (>= 1) are required' });
    return;
  }

  try {
    const order = await createOrder(productId, quantity);
    res.status(201).json(order);
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ error: 'Product not found' });
    } else if (error.message === 'INSUFFICIENT_STOCK') {
      res.status(409).json({ error: 'Insufficient stock' });
    } else if (error.message === 'CONCURRENT_UPDATE_FAILED') {
      res.status(409).json({ error: 'Too many concurrent requests. Please retry.' });
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
}

export async function getByNumber(req: Request, res: Response): Promise<void> {
  const orderNumber = req.params.orderNumber as string;

  try {
    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get order' });
  }
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const orderNumber = req.params.orderNumber as string;

  try {
    const order = await cancelOrder(orderNumber);
    if (!order) {
      res.status(404).json({ error: 'Order not found or not cancellable' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
}
