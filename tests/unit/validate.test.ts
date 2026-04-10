import { Request, Response, NextFunction } from 'express';
import { validate, productCreateRules, orderCreateRules, paymentCreateRules } from '../../src/middleware/validate';
import { BadRequestError } from '../../src/errors/AppError';

function mockReq(body: any): Request {
  return { body } as Request;
}

const mockRes = {} as Response;

describe('validate middleware', () => {
  describe('productCreateRules', () => {
    const middleware = validate(productCreateRules);

    it('유효한 요청은 next()를 호출한다', () => {
      const next = jest.fn();
      middleware(mockReq({ name: '테스트 상품', price: 10000, stock: 5 }), mockRes, next);
      expect(next).toHaveBeenCalled();
    });

    it('name이 없으면 BadRequestError를 던진다', () => {
      const next = jest.fn();
      expect(() => middleware(mockReq({ price: 10000, stock: 5 }), mockRes, next)).toThrow(BadRequestError);
    });

    it('price가 음수이면 BadRequestError를 던진다', () => {
      const next = jest.fn();
      expect(() => middleware(mockReq({ name: '테스트', price: -1, stock: 5 }), mockRes, next)).toThrow(BadRequestError);
    });

    it('stock이 소수이면 BadRequestError를 던진다', () => {
      const next = jest.fn();
      expect(() => middleware(mockReq({ name: '테스트', price: 1000, stock: 1.5 }), mockRes, next)).toThrow(BadRequestError);
    });

    it('price가 문자열이면 BadRequestError를 던진다', () => {
      const next = jest.fn();
      expect(() => middleware(mockReq({ name: '테스트', price: 'abc', stock: 5 }), mockRes, next)).toThrow(BadRequestError);
    });
  });

  describe('orderCreateRules', () => {
    const middleware = validate(orderCreateRules);

    it('유효한 요청은 next()를 호출한다', () => {
      const next = jest.fn();
      middleware(mockReq({ productId: 1, quantity: 2 }), mockRes, next);
      expect(next).toHaveBeenCalled();
    });

    it('quantity가 0이면 BadRequestError를 던진다', () => {
      const next = jest.fn();
      expect(() => middleware(mockReq({ productId: 1, quantity: 0 }), mockRes, next)).toThrow(BadRequestError);
    });

    it('productId가 없으면 BadRequestError를 던진다', () => {
      const next = jest.fn();
      expect(() => middleware(mockReq({ quantity: 1 }), mockRes, next)).toThrow(BadRequestError);
    });
  });

  describe('paymentCreateRules', () => {
    const middleware = validate(paymentCreateRules);

    it('유효한 요청은 next()를 호출한다', () => {
      const next = jest.fn();
      middleware(mockReq({ orderNumber: 'uuid-123', idempotencyKey: 'key-456' }), mockRes, next);
      expect(next).toHaveBeenCalled();
    });

    it('idempotencyKey가 없으면 BadRequestError를 던진다', () => {
      const next = jest.fn();
      expect(() => middleware(mockReq({ orderNumber: 'uuid-123' }), mockRes, next)).toThrow(BadRequestError);
    });
  });
});
