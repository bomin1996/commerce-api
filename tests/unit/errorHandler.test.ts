import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/errorHandler';
import { AppError, NotFoundError, ConflictError, BadRequestError } from '../../src/errors/AppError';

function createMockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

const mockReq = { method: 'GET', path: '/test' } as Request;
const mockNext = jest.fn() as NextFunction;

describe('errorHandler', () => {
  it('NotFoundError를 404로 응답한다', () => {
    const res = createMockRes();
    errorHandler(new NotFoundError('Product not found'), mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Product not found',
      code: 'NOT_FOUND',
    });
  });

  it('ConflictError를 409로 응답한다', () => {
    const res = createMockRes();
    errorHandler(new ConflictError('Insufficient stock', 'INSUFFICIENT_STOCK'), mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Insufficient stock',
      code: 'INSUFFICIENT_STOCK',
    });
  });

  it('BadRequestError를 400으로 응답한다', () => {
    const res = createMockRes();
    errorHandler(new BadRequestError('name is required'), mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'name is required',
      code: 'BAD_REQUEST',
    });
  });

  it('일반 Error를 500으로 응답한다', () => {
    const res = createMockRes();
    errorHandler(new Error('unexpected'), mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
