import { Router } from 'express';
import { submitSupportTicket, subscribeNewsletter } from '../controllers/supportController.js';
import { optionalFirebaseToken } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/securityMiddleware.js';

const router = Router();

const supportTicketLimiter = createRateLimiter({
  name: 'support-ticket',
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  blockDurationMs: 10 * 60 * 1000,
});

const newsletterLimiter = createRateLimiter({
  name: 'newsletter',
  windowMs: 10 * 60 * 1000,
  maxRequests: 15,
  blockDurationMs: 10 * 60 * 1000,
});

router.post('/support/tickets', supportTicketLimiter, optionalFirebaseToken, submitSupportTicket);
router.post('/newsletter/subscribe', newsletterLimiter, optionalFirebaseToken, subscribeNewsletter);

export default router;

