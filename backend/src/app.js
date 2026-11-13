import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { checkFirestoreConnection } from './config/firebase.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

import { securityHeaders, detectSuspiciousRequest, createRateLimiter } from './middleware/securityMiddleware.js';

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, mobile apps, Postman) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(detectSuspiciousRequest);
app.use('/api', createRateLimiter({ name: 'global-api', windowMs: 60000, maxRequests: 180, blockDurationMs: 300000 }));

// Health Check Endpoint (verifies Express + live Firebase Firestore connectivity)
app.get('/api/health', async (_req, res, next) => {
  try {
    const firebase = await checkFirestoreConnection();
    const statusCode = firebase.connected ? 200 : 503;

    res.status(statusCode).json({
      status: firebase.connected ? 'online' : 'degraded',
      brand: 'TechTonic Store API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      firebase,
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api', catalogRoutes);
app.use('/api', authRoutes);
app.use('/api', orderRoutes);
app.use('/api', supportRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`TechTonic API running on http://localhost:${PORT}`);
  });
}
