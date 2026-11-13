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
import { optionalFirebaseToken, verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/securityMiddleware.js';

const router = Router();
const authAuditLimiter = createRateLimiter({
  name: 'auth-audit',
  windowMs: 5 * 60 * 1000,
  maxRequests: 25,
  blockDurationMs: 5 * 60 * 1000,
});

router.get('/auth/me', verifyFirebaseToken, getMe);
router.put('/auth/profile', verifyFirebaseToken, updateProfile);
router.put('/auth/state', verifyFirebaseToken, syncState);
router.get('/auth/2fa/status', verifyFirebaseToken, getTwoFactorStatus);
router.post('/auth/2fa/setup/begin', verifyFirebaseToken, beginTwoFactorSetup);
router.post('/auth/2fa/setup/confirm', verifyFirebaseToken, confirmTwoFactorSetup);
router.post('/auth/2fa/verify', verifyFirebaseToken, verifyTwoFactor);
router.post('/auth/2fa/disable', verifyFirebaseToken, disableTwoFactor);
router.post('/auth/check-registration-email', authAuditLimiter, checkRegistrationEmail);
router.post('/auth/audit', authAuditLimiter, optionalFirebaseToken, reportAuthAudit);

router.get('/addresses', verifyFirebaseToken, getAddresses);
router.post('/addresses', verifyFirebaseToken, createAddress);
router.put('/addresses/:id', verifyFirebaseToken, updateAddress);
router.delete('/addresses/:id', verifyFirebaseToken, deleteAddress);

export default router;

