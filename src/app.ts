import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import productRoutes from './routes/product.route';
import orderRoutes from './routes/order.route';
import paymentRoutes from './routes/payment.route';
import healthRoutes from './routes/health.route';

const app = express();

app.use(express.json());
app.use(globalLimiter);

// Swagger API 문서
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(healthRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use(paymentRoutes);

// 글로벌 에러 핸들러
app.use(errorHandler);

export default app;
