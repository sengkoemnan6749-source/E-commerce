import QRCode from 'qrcode';
import * as userService from '../services/userService.js';
import * as userSecurityService from '../services/userSecurityService.js';

export async function getMe(req, res, next) {
  try {
    const profile = await userService.getOrCreateUserProfile(req.user);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const profile = await userService.updateUserProfile(req.user, req.body);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAddresses(req, res, next) {
  try {
    const addresses = await userService.listAddresses(req.user.uid);
    res.json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAddress(req, res, next) {
  try {
    const created = await userService.createAddress(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const updated = await userService.updateAddress(req.user.uid, req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const result = await userService.deleteAddress(req.user.uid, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

const ALLOWED_CLIENT_AUTH_EVENTS = new Set([
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'REGISTER_SUCCESS',
  'REGISTER_FAILED',
  'LOGOUT',
  'BRUTE_FORCE_LOCKOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_SET',
  'PASSWORD_RESET_REQUESTED',
]);

export async function getTwoFactorStatus(req, res, next) {
  try {
    const data = await userSecurityService.getUser2faStatus(req);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function beginTwoFactorSetup(req, res, next) {
  try {
    const data = await userSecurityService.beginUser2faSetup(req, QRCode);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function confirmTwoFactorSetup(req, res, next) {
  try {
    const data = await userSecurityService.confirmUser2faSetup(req, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function verifyTwoFactor(req, res, next) {
  try {
    const data = await userSecurityService.verifyUser2fa(req, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function disableTwoFactor(req, res, next) {
  try {
    const data = await userSecurityService.disableUser2fa(req, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function checkRegistrationEmail(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim();
    const result = await userService.validateRegistrationEmail(email);
    res.json({ success: true, data: result });
  } catch (error) {
    import('../services/auditService.js')
      .then(({ recordAuditEvent }) =>
        recordAuditEvent(req, {
          eventType: 'REGISTER_FAILED',
          severity: 'warning',
          actorEmail: String(req.body?.email || '').trim().slice(0, 120) || null,
          actorRole: 'guest',
          status: 'BLOCKED',
          details: `Registration email blocked (${error?.code || 'INVALID_EMAIL'}): ${error?.message || ''}`,
        })
      )
      .catch(() => {});
    next(error);
  }
}

export async function reportAuthAudit(req, res, next) {
  try {
    const { recordAuditEvent } = await import('../services/auditService.js');
    const rawEvent = String(req.body?.eventType || '').trim().toUpperCase();
    if (!ALLOWED_CLIENT_AUTH_EVENTS.has(rawEvent)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported client audit event type',
        code: 'INVALID_AUDIT_EVENT',
      });
    }

    const isThreat = rawEvent === 'BRUTE_FORCE_LOCKOUT';
    const isWarn = rawEvent === 'LOGIN_FAILED' || rawEvent === 'REGISTER_FAILED';
    const severity = isThreat ? 'critical' : isWarn ? 'warning' : 'info';

    const actorEmail =
      req.user?.email ||
      (typeof req.body?.email === 'string' ? req.body.email.trim().slice(0, 120) : null);

    await recordAuditEvent(req, {
      eventType: rawEvent,
      severity,
      actorUid: req.user?.uid || null,
      actorEmail: actorEmail || null,
      actorRole: req.user?.role || 'customer',
      status: isThreat ? 'BLOCKED' : isWarn ? 'FAILED' : 'SUCCESS',
      details: typeof req.body?.details === 'string' ? req.body.details.trim().slice(0, 300) : '',
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
}

export async function syncState(req, res, next) {
  try {
    const data = await userService.syncUserState(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

