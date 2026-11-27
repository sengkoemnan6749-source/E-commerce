import { Router } from 'express';
import {
  createCategory,
  createProduct,
  createPromoCode,
  deleteCategory,
  deleteProduct,
  deletePromoCode,
  getAuditLogs,
  getCustomers,
  getDashboard,
  getOrders,
  getPromoCodes,
  getShippingRates,
  updateCategory,
  updateCustomerRole,
  updateOrderStatus,
  updateProduct,
  updatePromoCode,
  updateShippingRates,
} from '../controllers/adminController.js';
import { requireAdmin, verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { requireAdminVault } from '../middleware/adminVaultMiddleware.js';
import { createRateLimiter } from '../middleware/securityMiddleware.js';
import {
  beginVaultSetup,
  confirmVaultSetup,
  getVaultStatus,
  lockVault,
  unlockVault,
} from '../controllers/adminVaultController.js';
import {
  getAdminSupportTickets,
  patchAdminSupportTicket,
  getTelegramStatus,
  connectTelegramBot,
  testTelegramBot,
  getOrderTelegramStatus,
  configureOrderTelegramBot,
  connectOrderTelegramBot,
  testOrderTelegramBot,
} from '../controllers/supportController.js';

const router = Router();

const adminVaultAttemptLimiter = createRateLimiter({
  name: 'admin-vault-attempt',
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  blockDurationMs: 15 * 60 * 1000,
});

// Layer 1: All /api/admin/* endpoints require a verified Firebase token AND admin role
router.use(verifyFirebaseToken, requireAdmin);

// Layers 2-5 Admin Vault lifecycle routes
router.get('/vault/status', getVaultStatus);
router.post('/vault/setup/begin', beginVaultSetup);
router.post('/vault/setup/confirm', adminVaultAttemptLimiter, confirmVaultSetup);
router.post('/vault/unlock', adminVaultAttemptLimiter, unlockVault);
router.post('/vault/lock', lockVault);

// Layers 2-5: Require unlocked, IP/device-bound Admin Security Vault token for all admin operations
router.use(requireAdminVault);

router.get('/dashboard', getDashboard);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/customers', getCustomers);
router.patch('/customers/:id/role', updateCustomerRole);
router.get('/promos', getPromoCodes);
router.post('/promos', createPromoCode);
router.patch('/promos/:code', updatePromoCode);
router.delete('/promos/:code', deletePromoCode);
router.get('/shipping-rates', getShippingRates);
router.put('/shipping-rates', updateShippingRates);
router.get('/audit-logs', getAuditLogs);
router.get('/support-tickets', getAdminSupportTickets);
router.patch('/support-tickets/:id', patchAdminSupportTicket);
router.get('/telegram/status', getTelegramStatus);
router.post('/telegram/connect', connectTelegramBot);
router.post('/telegram/test', testTelegramBot);
router.get('/telegram/orders/status', getOrderTelegramStatus);
router.post('/telegram/orders/configure', configureOrderTelegramBot);
router.post('/telegram/orders/connect', connectOrderTelegramBot);
router.post('/telegram/orders/test', testOrderTelegramBot);

export default router;

