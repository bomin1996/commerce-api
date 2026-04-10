import { AppError, NotFoundError, ConflictError, BadRequestError } from '../../src/errors/AppError';

describe('AppError', () => {
  it('statusCode와 message를 가진다', () => {
    const error = new AppError(422, 'Unprocessable', 'VALIDATION');
    expect(error.statusCode).toBe(422);
    expect(error.message).toBe('Unprocessable');
    expect(error.code).toBe('VALIDATION');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('404 상태코드를 가진다', () => {
    const error = new NotFoundError('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ConflictError', () => {
  it('409 상태코드를 가진다', () => {
    const error = new ConflictError('Conflict', 'STOCK_CONFLICT');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('STOCK_CONFLICT');
  });

  it('코드가 없으면 기본값 CONFLICT를 사용한다', () => {
    const error = new ConflictError('Conflict');
    expect(error.code).toBe('CONFLICT');
  });
});

describe('BadRequestError', () => {
  it('400 상태코드를 가진다', () => {
    const error = new BadRequestError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
  });
});
