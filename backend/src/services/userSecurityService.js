import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { getClientIp, recordAuditEvent } from './auditService.js';
import {
  generateBase32Secret,
  getSigningSecret,
  verifyTotpCode,
} from './adminVaultService.js';

const USER_2FA_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours per browser session
const MAX_2FA_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const failureBuckets = new Map();

function ensureDb() {
  if (!db) {
    throw new AppError('Database is unavailable', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function sha256Hex(v) {
  return crypto.createHash('sha256').update(String(v || '')).digest('hex');
}

async function signUser2faToken(uid) {
  const secret = await getSigningSecret();
  const payload = {
    uid,
    type: 'user_2fa',
    iat: Date.now(),
    exp: Date.now() + USER_2FA_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

async function verifyUser2faToken(token, expectedUid) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [encoded, providedSig] = token.split('.');
  if (!encoded || !providedSig) return false;
  const secret = await getSigningSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))
  ) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return (
      payload.type === 'user_2fa' &&
      payload.uid === expectedUid &&
      Boolean(payload.exp) &&
      Date.now() <= payload.exp
    );
  } catch {
    return false;
  }
}

function checkLockout(uid, req) {
  const key = `${uid}:${getClientIp(req)}`;
  const entry = failureBuckets.get(key);
  if (entry && entry.lockedUntil > Date.now()) {
    const secs = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    throw new AppError(
      `Too many incorrect 2FA attempts. Try again in ${secs}s.`,
      429,
      'USER_2FA_LOCKED'
    );
  }
}

async function recordFailure(uid, req) {
  const key = `${uid}:${getClientIp(req)}`;
  const now = Date.now();
  let entry = failureBuckets.get(key);
  if (!entry || now - entry.windowStart > LOCKOUT_MS) {
    entry = { count: 0, windowStart: now, lockedUntil: 0 };
  }
  entry.count += 1;

  if (entry.count >= MAX_2FA_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_MS;
    failureBuckets.set(key, entry);
    await recordAuditEvent(req, {
      eventType: 'USER_2FA_LOCKOUT',
      severity: 'critical',
      targetType: 'user_security',
      targetId: uid,
      status: 'BLOCKED',
      details: `Locked user 2FA verification for 15m after ${entry.count} failed attempts`,
    });
    throw new AppError(
      'Too many failed 2FA attempts. Temporarily locked for 15 minutes.',
      429,
      'USER_2FA_LOCKED'
    );
  }

  failureBuckets.set(key, entry);
  const remaining = MAX_2FA_FAILURES - entry.count;
  await recordAuditEvent(req, {
    eventType: 'USER_2FA_FAILED',
    severity: 'warning',
    targetType: 'user_security',
    targetId: uid,
    status: 'FAILED',
    details: `Invalid 2FA verification code (${remaining} attempts remaining)`,
  });
  return remaining;
}

export async function getUser2faStatus(req) {
  const firestore = ensureDb();
  const snap = await firestore.collection('userSecurity').doc(req.user.uid).get();
  const data = snap.exists ? snap.data() : null;
  const enabled = Boolean(data?.enabled);

  let verified = !enabled;
  if (enabled && req.headers['x-user-2fa']) {
    verified = await verifyUser2faToken(req.headers['x-user-2fa'], req.user.uid);
  }

  return {
    enabled,
    verified,
    remainingRecoveryCodes: Array.isArray(data?.recoveryHashes) ? data.recoveryHashes.length : 0,
  };
}

export async function beginUser2faSetup(req, QRCode) {
  const firestore = ensureDb();
  const ref = firestore.collection('userSecurity').doc(req.user.uid);
  const snap = await ref.get();
  if (snap.exists && snap.data()?.enabled) {
    throw new AppError('Two-factor authentication is already enabled on this account.', 409, 'USER_2FA_ALREADY_ENABLED');
  }

  const pendingSecret = generateBase32Secret(20);
  const label = req.user.email || req.user.uid;
  const otpauthUrl = `otpauth://totp/TechTonic:${encodeURIComponent(label)}?secret=${pendingSecret}&issuer=TechTonic%20Store&algorithm=SHA1&digits=6&period=30`;
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 200, margin: 1 });

  await ref.set(
    {
      uid: req.user.uid,
      email: req.user.email || '',
      enabled: false,
      pendingSecret,
      pendingExpiresAt: Date.now() + 10 * 60 * 1000,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { secret: pendingSecret, otpauthUrl, qrDataUrl };
}

export async function confirmUser2faSetup(req, { totpCode } = {}) {
  const firestore = ensureDb();
  const ref = firestore.collection('userSecurity').doc(req.user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;

  if (data?.enabled) {
    throw new AppError('Two-factor authentication is already enabled.', 409, 'USER_2FA_ALREADY_ENABLED');
  }
  if (!data?.pendingSecret || !data?.pendingExpiresAt || Date.now() > data.pendingExpiresAt) {
    throw new AppError('2FA setup session expired. Please generate a new QR code.', 400, 'SETUP_EXPIRED');
  }
  if (!verifyTotpCode(data.pendingSecret, totpCode)) {
    throw new AppError('Invalid 6-digit verification code.', 400, 'INVALID_TOTP');
  }

  const recoveryCodes = Array.from({ length: 6 }, () => {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TTU-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
  const recoveryHashes = recoveryCodes.map((c) => sha256Hex(c));

  await ref.set({
    uid: req.user.uid,
    email: req.user.email || '',
    enabled: true,
    totpSecret: data.pendingSecret,
    recoveryHashes,
    enabledAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const twoFactorToken = await signUser2faToken(req.user.uid);

  await recordAuditEvent(req, {
    eventType: 'USER_2FA_ENABLED',
    severity: 'info',
    targetType: 'user_security',
    targetId: req.user.uid,
    status: 'SUCCESS',
    details: 'User enabled Two-Factor Authentication (TOTP)',
  });

  return { enabled: true, verified: true, twoFactorToken, recoveryCodes };
}

export async function verifyUser2fa(req, { totpCode, recoveryCode } = {}) {
  checkLockout(req.user.uid, req);

  const firestore = ensureDb();
  const ref = firestore.collection('userSecurity').doc(req.user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;

  if (!data?.enabled) {
    const twoFactorToken = await signUser2faToken(req.user.uid);
    return { verified: true, enabled: false, twoFactorToken };
  }

  let usedRecoveryHash = null;
  if (recoveryCode && String(recoveryCode).trim()) {
    const recHash = sha256Hex(String(recoveryCode).trim().toUpperCase());
    const hashes = Array.isArray(data.recoveryHashes) ? data.recoveryHashes : [];
    if (!hashes.includes(recHash)) {
      const remaining = await recordFailure(req.user.uid, req);
      throw new AppError(`Invalid backup recovery code (${remaining} attempts left).`, 401, 'INVALID_RECOVERY_CODE');
    }
    usedRecoveryHash = recHash;
  } else {
    if (!verifyTotpCode(data.totpSecret, totpCode)) {
      const remaining = await recordFailure(req.user.uid, req);
      throw new AppError(`Invalid 6-digit verification code (${remaining} attempts left).`, 401, 'INVALID_TOTP');
    }
  }

  failureBuckets.delete(`${req.user.uid}:${getClientIp(req)}`);

  if (usedRecoveryHash) {
    await ref.set(
      {
        recoveryHashes: (data.recoveryHashes || []).filter((h) => h !== usedRecoveryHash),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  const twoFactorToken = await signUser2faToken(req.user.uid);

  await recordAuditEvent(req, {
    eventType: 'USER_2FA_VERIFIED',
    severity: usedRecoveryHash ? 'warning' : 'info',
    targetType: 'user_security',
    targetId: req.user.uid,
    status: 'SUCCESS',
    details: usedRecoveryHash
      ? 'User 2FA verified with one-time recovery code'
      : 'User 2FA verified with Authenticator code',
  });

  return { verified: true, enabled: true, twoFactorToken };
}

export async function disableUser2fa(req, { totpCode, recoveryCode } = {}) {
  checkLockout(req.user.uid, req);

  const firestore = ensureDb();
  const ref = firestore.collection('userSecurity').doc(req.user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;

  if (!data?.enabled) {
    return { enabled: false };
  }

  let valid = false;
  if (recoveryCode && String(recoveryCode).trim()) {
    const recHash = sha256Hex(String(recoveryCode).trim().toUpperCase());
    valid = Array.isArray(data.recoveryHashes) && data.recoveryHashes.includes(recHash);
  } else {
    valid = verifyTotpCode(data.totpSecret, totpCode);
  }

  if (!valid) {
    const remaining = await recordFailure(req.user.uid, req);
    throw new AppError(
      `Verification code required to disable 2FA (${remaining} attempts left).`,
      401,
      'INVALID_TOTP'
    );
  }

  failureBuckets.delete(`${req.user.uid}:${getClientIp(req)}`);

  await ref.set({
    uid: req.user.uid,
    email: req.user.email || '',
    enabled: false,
    disabledAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await recordAuditEvent(req, {
    eventType: 'USER_2FA_DISABLED',
    severity: 'warning',
    targetType: 'user_security',
    targetId: req.user.uid,
    status: 'SUCCESS',
    details: 'User disabled Two-Factor Authentication',
  });

  return { enabled: false };
}

