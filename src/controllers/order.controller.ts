import { Request, Response } from 'express';
import { createOrder, getOrderByNumber, cancelOrder } from '../services/order.service';
import { NotFoundError } from '../errors/AppError';

export async function create(req: Request, res: Response): Promise<void> {
  const { productId, quantity } = req.body;
  const order = await createOrder(productId, quantity);
  res.status(201).json(order);
}

export async function getByNumber(req: Request, res: Response): Promise<void> {
  const orderNumber = req.params.orderNumber as string;
  const order = await getOrderByNumber(orderNumber);

  if (!order) throw new NotFoundError('Order not found');

  res.json(order);
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const orderNumber = req.params.orderNumber as string;
  const order = await cancelOrder(orderNumber);

  if (!order) throw new NotFoundError('Order not found or not cancellable');

  res.json(order);
}
