import { Router } from 'express';
import {
  beginTwoFactorSetup,
  checkRegistrationEmail,
  confirmTwoFactorSetup,
  createAddress,
  deleteAddress,
  disableTwoFactor,
  getAddresses,
  getMe,
  getTwoFactorStatus,
  reportAuthAudit,
  syncState,
  updateAddress,
  updateProfile,
  verifyTwoFactor,
} from '../controllers/authController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/securityMiddleware.js';
import { requireUser2fa } from '../services/userSecurityService.js';

const router = Router();
const authAuditLimiter = createRateLimiter({
  name: 'auth-audit',
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
  blockDurationMs: 5 * 60 * 1000,
});

const regCheckLimiter = createRateLimiter({
  name: 'registration-check',
  windowMs: 10 * 60 * 1000,
  maxRequests: 15,
  blockDurationMs: 10 * 60 * 1000,
});

const twoFactorAttemptLimiter = createRateLimiter({
  name: 'user-2fa-attempt',
  windowMs: 10 * 60 * 1000,
  maxRequests: 12,
  blockDurationMs: 10 * 60 * 1000,
});

router.get('/auth/me', verifyFirebaseToken, requireUser2fa, getMe);
router.put('/auth/profile', verifyFirebaseToken, requireUser2fa, updateProfile);
router.put('/auth/state', verifyFirebaseToken, requireUser2fa, syncState);
router.get('/auth/2fa/status', verifyFirebaseToken, getTwoFactorStatus);
router.post('/auth/2fa/setup/begin', verifyFirebaseToken, beginTwoFactorSetup);
router.post('/auth/2fa/setup/confirm', verifyFirebaseToken, twoFactorAttemptLimiter, confirmTwoFactorSetup);
router.post('/auth/2fa/verify', verifyFirebaseToken, twoFactorAttemptLimiter, verifyTwoFactor);
router.post('/auth/2fa/disable', verifyFirebaseToken, twoFactorAttemptLimiter, disableTwoFactor);
router.post('/auth/check-registration-email', regCheckLimiter, checkRegistrationEmail);
router.post('/auth/audit', authAuditLimiter, verifyFirebaseToken, reportAuthAudit);

router.get('/addresses', verifyFirebaseToken, requireUser2fa, getAddresses);
router.post('/addresses', verifyFirebaseToken, requireUser2fa, createAddress);
router.put('/addresses/:id', verifyFirebaseToken, requireUser2fa, updateAddress);
router.delete('/addresses/:id', verifyFirebaseToken, requireUser2fa, deleteAddress);

export default router;

