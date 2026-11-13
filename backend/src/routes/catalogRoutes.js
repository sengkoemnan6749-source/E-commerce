import { Router } from 'express';
import {
  createProductReview,
  getCategories,
  getProductById,
  getProductReviews,
  getProducts,
  markReviewHelpful,
} from '../controllers/catalogController.js';
import { optionalFirebaseToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', optionalFirebaseToken, createProductReview);
router.post('/products/:id/reviews/:reviewId/helpful', markReviewHelpful);

export default router;

