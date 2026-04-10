# Commerce API

동시성 제어와 멱등성을 고려한 커머스 백엔드 API입니다.  
단순 CRUD를 넘어, **실제 서비스에서 발생하는 문제(재고 race condition, 중복 결제)**를 어떻게 해결하는지에 초점을 맞췄습니다.

## Architecture

```
Client
  │
  ▼
┌──────────────────────────────────────────────┐
│  Express Server                              │
│  ├─ Rate Limiter (100 req/min)               │
│  ├─ Validation Middleware                    │
│  ├─ Controllers                              │
│  ├─ Services (Business Logic)                │
│  └─ Global Error Handler                     │
└──────┬───────────────────┬───────────────────┘
       │                   │
┌──────▼──────┐     ┌──────▼──────┐
│    Redis    │     │    MySQL    │
│  (Cache +   │     │   (Main)   │
│  D-Lock)    │     │            │
└─────────────┘     └────────────┘
```

## 핵심 설계

### 1. 재고 동시성 제어 - 낙관적 락 (Optimistic Lock)

```
문제: 10명이 동시에 마지막 1개 상품을 주문하면?
     → 재고가 -9가 될 수 있음 (overselling)

해결: version 컬럼으로 충돌 감지
     UPDATE products SET stock = stock - 1, version = version + 1
     WHERE id = ? AND version = ?
     → affectedRows === 0이면 충돌 → 재시도 (최대 3회)
```

**왜 낙관적 락인가?**
- 비관적 락(SELECT FOR UPDATE)은 행을 잠가서 동시 요청 시 대기 발생
- 커머스는 읽기 >> 쓰기이므로 충돌 빈도가 낮음
- 낙관적 락이 처리량 면에서 유리

### 2. 결제 멱등성 (Idempotency)

```
문제: 결제 요청 후 네트워크 오류로 응답을 못 받으면?
     → 재시도 시 이중 결제 발생

해결: idempotency_key로 중복 방지
     1. 같은 key로 이미 결제됨 → 기존 결과 반환
     2. Redis 분산 락으로 동시 요청 방지
     3. 트랜잭션으로 결제 + 주문 상태 원자적 변경
```

### 3. 트랜잭션 처리

- 주문 생성: 재고 차감 + 주문 생성을 하나의 트랜잭션으로
- 주문 취소: 주문 상태 변경 + 재고 복구를 하나의 트랜잭션으로
- 결제: 결제 기록 + 주문 상태 변경을 하나의 트랜잭션으로

### 4. 에러 처리 체계

```
AppError (base)
├── BadRequestError  (400)  — 입력 검증 실패
├── NotFoundError    (404)  — 리소스 없음
└── ConflictError    (409)  — 재고 부족, 동시성 충돌, 중복 결제
```

- 검증 미들웨어가 컨트롤러 진입 전 요청을 검증
- 서비스 레이어에서 비즈니스 에러를 커스텀 에러로 throw
- 글로벌 에러 핸들러가 일관된 JSON 응답으로 변환

## Tech Stack

| 구분 | 기술 |
|------|------|
| Runtime | Node.js 18 |
| Language | TypeScript (strict mode) |
| Framework | Express 5 |
| Database | MySQL 8.0 |
| Cache / Lock | Redis 7 |
| API Docs | Swagger (OpenAPI 3.0) |
| Test | Jest + Supertest (통합 + 단위) |
| CI | GitHub Actions |
| Container | Docker, Docker Compose |

## API

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | 헬스 체크 (API, MySQL, Redis 상태) |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | 상품 등록 |
| GET | `/api/products` | 상품 목록 (페이지네이션, 검색, 가격 필터) |
| GET | `/api/products/:id` | 상품 상세 (Redis 캐싱) |
| PATCH | `/api/products/:id` | 상품 수정 |
| DELETE | `/api/products/:id` | 상품 삭제 |

**검색 파라미터:**
```
GET /api/products?keyword=나이키&minPrice=100000&maxPrice=200000&page=1&limit=10
```

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | 주문 생성 (낙관적 락 재고 차감) |
| GET | `/api/orders/:orderNumber` | 주문 조회 |
| POST | `/api/orders/:orderNumber/cancel` | 주문 취소 (재고 복구) |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | 결제 처리 (멱등성 보장) |

> Swagger 문서: `http://localhost:3001/api-docs`

## Quick Start

### Docker Compose

```bash
docker-compose up -d
```

### 로컬 실행

```bash
npm install
cp .env.example .env
npm run dev
```

## Test

```bash
# 전체 테스트
npm test

# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration
```

## Project Structure

```
src/
├── app.ts                    # Express 앱 + 미들웨어 구성
├── server.ts                 # 진입점
├── config/
│   ├── database.ts           # MySQL 연결 + 스키마
│   ├── redis.ts              # Redis 연결
│   ├── logger.ts             # 로깅 시스템
│   └── swagger.ts            # Swagger 설정
├── errors/
│   └── AppError.ts           # 커스텀 에러 클래스
├── controllers/
│   ├── product.controller.ts
│   ├── order.controller.ts
│   └── payment.controller.ts
├── services/
│   ├── product.service.ts    # 상품 CRUD + 캐싱 + 검색
│   ├── order.service.ts      # 주문 + 낙관적 락
│   └── payment.service.ts    # 결제 + 멱등성
├── middleware/
│   ├── errorHandler.ts       # 글로벌 에러 핸들러
│   ├── validate.ts           # 요청 검증 미들웨어
│   └── rateLimiter.ts        # Rate Limiting
└── routes/
    ├── health.route.ts       # 헬스 체크
    ├── product.route.ts      # Swagger 문서 포함
    ├── order.route.ts
    └── payment.route.ts
tests/
├── unit/
│   ├── appError.test.ts      # 에러 클래스 테스트
│   ├── errorHandler.test.ts  # 에러 핸들러 테스트
│   └── validate.test.ts      # 검증 미들웨어 테스트
└── integration/
    ├── product.test.ts
    ├── order.test.ts
    └── payment.test.ts
```
