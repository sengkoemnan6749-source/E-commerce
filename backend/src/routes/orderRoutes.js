import { Router } from 'express';
import {
  createKhqrPayment,
  createOrder,
  getActivePromos,
  getMyOrders,
  getOrderById,
  processCardPayment,
  validatePromo,
  verifyKhqrPayment,
} from '../controllers/orderController.js';
import { optionalFirebaseToken, verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = Router();

// Promo discovery & validation
router.get('/promos/active', getActivePromos);
router.post('/promos/validate', validatePromo);

// Orders
router.post('/orders', optionalFirebaseToken, createOrder);
router.get('/orders', verifyFirebaseToken, getMyOrders);
router.get('/orders/:id', optionalFirebaseToken, getOrderById);

// Payments (Bakong KHQR & Card)
router.post('/payments/khqr', optionalFirebaseToken, createKhqrPayment);
router.post('/payments/khqr/verify', optionalFirebaseToken, verifyKhqrPayment);
router.post('/payments/card', optionalFirebaseToken, processCardPayment);

export default router;

