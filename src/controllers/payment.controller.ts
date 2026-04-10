import { Request, Response } from 'express';
import { processPayment } from '../services/payment.service';

export async function pay(req: Request, res: Response): Promise<void> {
  const { orderNumber, idempotencyKey } = req.body;
  const payment = await processPayment(orderNumber, idempotencyKey);
  res.status(201).json(payment);
}
