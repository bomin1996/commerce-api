import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/AppError';

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'integer';
  min?: number;
}

export function validate(rules: ValidationRule[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        throw new BadRequestError(`${rule.field} is required`);
      }

      if (value === undefined || value === null) continue;

      if (rule.type === 'number' || rule.type === 'integer') {
        if (typeof value !== 'number' || isNaN(value)) {
          throw new BadRequestError(`${rule.field} must be a number`);
        }
        if (rule.type === 'integer' && !Number.isInteger(value)) {
          throw new BadRequestError(`${rule.field} must be an integer`);
        }
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        throw new BadRequestError(`${rule.field} must be a string`);
      }

      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        throw new BadRequestError(`${rule.field} must be at least ${rule.min}`);
      }
    }

    next();
  };
}

export const productCreateRules: ValidationRule[] = [
  { field: 'name', required: true, type: 'string' },
  { field: 'price', required: true, type: 'number', min: 0 },
  { field: 'stock', required: true, type: 'integer', min: 0 },
];

export const orderCreateRules: ValidationRule[] = [
  { field: 'productId', required: true, type: 'integer', min: 1 },
  { field: 'quantity', required: true, type: 'integer', min: 1 },
];

export const paymentCreateRules: ValidationRule[] = [
  { field: 'orderNumber', required: true, type: 'string' },
  { field: 'idempotencyKey', required: true, type: 'string' },
];
