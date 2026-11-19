import { Router } from 'express';
import {
  createKhqrPayment,
  createOrder,
  getActivePromos,
  getMyOrders,
  getOrderById,
  processCardPayment,
  telegramPaymentWebhook,
  validatePromo,
  verifyKhqrPayment,
} from '../controllers/orderController.js';
import { optionalFirebaseToken, verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/securityMiddleware.js';
import { requireUser2fa } from '../services/userSecurityService.js';

const router = Router();

const khqrCreateLimiter = createRateLimiter({
  name: 'payment-khqr-create',
  windowMs: 60 * 1000,
  maxRequests: 20,
  blockDurationMs: 5 * 60 * 1000,
});

const khqrVerifyLimiter = createRateLimiter({
  name: 'payment-khqr-verify',
  windowMs: 60 * 1000,
  maxRequests: 60,
  blockDurationMs: 3 * 60 * 1000,
});

const orderCreateLimiter = createRateLimiter({
  name: 'order-create',
  windowMs: 60 * 1000,
  maxRequests: 10,
  blockDurationMs: 5 * 60 * 1000,
});

const orderLookupLimiter = createRateLimiter({
  name: 'order-lookup',
  windowMs: 60 * 1000,
  maxRequests: 30,
  blockDurationMs: 2 * 60 * 1000,
});

const cardDisabledLimiter = createRateLimiter({
  name: 'payment-card-disabled',
  windowMs: 60 * 1000,
  maxRequests: 5,
  blockDurationMs: 10 * 60 * 1000,
});

const promoValidateLimiter = createRateLimiter({
  name: 'promo-validate',
  windowMs: 5 * 60 * 1000,
  maxRequests: 25,
  blockDurationMs: 5 * 60 * 1000,
});

// Promo discovery & validation
router.get('/promos/active', getActivePromos);
router.post('/promos/validate', promoValidateLimiter, validatePromo);

// Orders (strict authenticated placement + 2FA enforcement + rate-limited lookup)
router.post('/orders', verifyFirebaseToken, requireUser2fa, orderCreateLimiter, createOrder);
router.get('/orders', verifyFirebaseToken, requireUser2fa, getMyOrders);
router.get('/orders/:id', orderLookupLimiter, optionalFirebaseToken, getOrderById);

// Payments (KHQR strictly authenticated + 2FA verified; Card gateway disabled)
router.post('/payments/khqr', verifyFirebaseToken, requireUser2fa, khqrCreateLimiter, createKhqrPayment);
router.post('/payments/khqr/verify', verifyFirebaseToken, requireUser2fa, khqrVerifyLimiter, verifyKhqrPayment);
router.post('/payments/khqr/telegram-webhook', telegramPaymentWebhook);
router.post('/payments/card', verifyFirebaseToken, cardDisabledLimiter, processCardPayment);

export default router;

