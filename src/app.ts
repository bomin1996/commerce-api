import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { globalLimiter } from './middleware/rateLimiter';
import productRoutes from './routes/product.route';
import orderRoutes from './routes/order.route';
import paymentRoutes from './routes/payment.route';

const app = express();

app.use(express.json());
app.use(globalLimiter);

// Swagger API 문서
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(productRoutes);
app.use(orderRoutes);
app.use(paymentRoutes);

export default app;
