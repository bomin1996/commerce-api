import { Request, Response } from 'express';
import { processPayment } from '../services/payment.service';

export async function pay(req: Request, res: Response): Promise<void> {
  const { orderNumber, idempotencyKey } = req.body;

  if (!orderNumber || !idempotencyKey) {
    res.status(400).json({ error: 'orderNumber and idempotencyKey are required' });
    return;
  }

  try {
    const payment = await processPayment(orderNumber, idempotencyKey);
    res.status(201).json(payment);
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      res.status(404).json({ error: 'Order not found' });
    } else if (error.message === 'ORDER_NOT_PAYABLE') {
      res.status(409).json({ error: 'Order is not payable (already paid or cancelled)' });
    } else if (error.message === 'PAYMENT_IN_PROGRESS') {
      res.status(409).json({ error: 'Payment is already being processed' });
    } else {
      res.status(500).json({ error: 'Failed to process payment' });
    }
  }
}
