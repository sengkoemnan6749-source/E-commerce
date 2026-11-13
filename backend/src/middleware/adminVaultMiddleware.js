import { db } from '../config/firebase.js';
import { AppError } from './errorHandler.js';
import { verifySignedVaultToken } from '../services/adminVaultService.js';
import { recordAuditEvent } from '../services/auditService.js';

/**
 * Enforces Layers 2-5 (Master PIN + TOTP 2FA verified Vault token bound to IP & User-Agent).
 */
export async function requireAdminVault(req, _res, next) {
  try {
    const token = req.headers['x-admin-vault'];

    if (!token) {
      let configured = false;
      if (db && req.user?.uid) {
        const snap = await db.collection('adminSecurity').doc(req.user.uid).get();
        configured = Boolean(snap.exists && snap.data()?.configured);
      }

      if (!configured) {
        return next(
          new AppError(
            'Admin 5-Layer Security setup is required before accessing admin data.',
            428,
            'VAULT_SETUP_REQUIRED'
          )
        );
      }

      return next(
        new AppError(
          'Admin Vault is locked. Complete Master PIN + Authenticator verification to continue.',
          403,
          'ADMIN_VAULT_LOCKED'
        )
      );
    }

    const check = await verifySignedVaultToken(token, req);
    if (!check.valid) {
      const isCritical =
        check.code === 'ADMIN_DEVICE_MISMATCH' || check.code === 'INVALID_VAULT_SIGNATURE';
      await recordAuditEvent(req, {
        eventType: check.code === 'ADMIN_DEVICE_MISMATCH' ? 'ADMIN_DEVICE_MISMATCH' : 'ADMIN_VAULT_REJECTED',
        severity: isCritical ? 'critical' : 'warning',
        targetType: 'admin_vault',
        targetId: req.user?.uid || null,
        status: 'BLOCKED',
        details: `${check.code}: ${check.message}`,
      });

      return next(new AppError(check.message, 403, check.code));
    }

    req.adminVault = check.payload;
    return next();
  } catch (error) {
    return next(error);
  }
}

