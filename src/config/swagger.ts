import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Commerce API',
      version: '1.0.0',
      description: '동시성 제어와 멱등성을 고려한 커머스 백엔드 API',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local server' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
