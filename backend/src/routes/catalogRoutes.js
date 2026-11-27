import { Router } from 'express';
import {
  createProductReview,
  getCategories,
  getProductById,
  getProductReviews,
  getProducts,
  getShippingRates,
  markReviewHelpful,
} from '../controllers/catalogController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/securityMiddleware.js';

const router = Router();

const reviewCreateLimiter = createRateLimiter({
  name: 'product-review-create',
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  blockDurationMs: 10 * 60 * 1000,
});

const reviewHelpfulLimiter = createRateLimiter({
  name: 'product-review-helpful',
  windowMs: 10 * 60 * 1000,
  maxRequests: 25,
  blockDurationMs: 5 * 60 * 1000,
});

router.get('/categories', getCategories);
router.get('/shipping-rates', getShippingRates);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', verifyFirebaseToken, reviewCreateLimiter, createProductReview);
router.post(
  '/products/:id/reviews/:reviewId/helpful',
  verifyFirebaseToken,
  reviewHelpfulLimiter,
  markReviewHelpful
);

export default router;

