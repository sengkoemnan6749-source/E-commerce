import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { checkFirestoreConnection } from './config/firebase.js';
import { AppError, errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import { startOrderBotListener } from './services/telegramService.js';
import { startBakongSettlementWatcher } from './services/paymentService.js';

import { securityHeaders, detectSuspiciousRequest, createRateLimiter } from './middleware/securityMiddleware.js';

const app = express();
app.disable('x-powered-by');
const trustProxyHops = Number(
  process.env.TRUST_PROXY_HOPS ?? (process.env.VERCEL === '1' ? 1 : 0)
);
app.set('trust proxy', Number.isFinite(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 0);
app.use(securityHeaders);
const PORT = Number(process.env.PORT) || 5000;

function normalizeOrigin(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) return true;
  // Allow Flutter Web / local dev servers on any localhost port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized)) {
    return true;
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, mobile apps, Postman) and localhost dev ports.
      if (isAllowedCorsOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new AppError('Origin not allowed by CORS policy', 403, 'CORS_FORBIDDEN'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(detectSuspiciousRequest);
app.use('/api', createRateLimiter({ name: 'global-api', windowMs: 60000, maxRequests: 600, blockDurationMs: 60000 }));

app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    brand: 'TechTonic Store API',
    health: '/api/health',
  });
});

// Health Check Endpoint (minimal public surface; avoids exposing internal project IDs, counts, or file paths)
app.get('/api/health', async (_req, res, next) => {
  try {
    const firebase = await checkFirestoreConnection();
    const statusCode = firebase.connected ? 200 : 503;

    res.status(statusCode).json({
      status: firebase.connected ? 'online' : 'degraded',
      brand: 'TechTonic Store API',
      timestamp: new Date().toISOString(),
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

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`TechTonic API running on http://localhost:${PORT}`);
    startOrderBotListener().catch(() => {});
    startBakongSettlementWatcher();
  });
}
