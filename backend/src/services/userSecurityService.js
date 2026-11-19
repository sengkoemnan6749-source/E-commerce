import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { getUserAgent, recordAuditEvent } from './auditService.js';
import {
  generateBase32Secret,
  getSigningSecret,
  matchTotpStep,
} from './adminVaultService.js';
import {
  decryptSecret,
  encryptSecret,
  findMatchingRecoveryIndex,
  generateRecoveryCodes,
  hashRecoveryCode,
} from '../utils/cryptoSecrets.js';

const USER_2FA_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours per browser session
const MAX_2FA_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function ensureDb() {
  if (!db) {
    throw new AppError('Database is unavailable', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function hashUa(req) {
  if (!req) return '';
  return crypto.createHash('sha256').update(String(getUserAgent(req) || '')).digest('hex').slice(0, 32);
}

async function signUser2faToken(uid, req = null) {
  const secret = await getSigningSecret();
  const now = Date.now();
  const payload = {
    uid,
    type: 'user_2fa',
    uaHash: hashUa(req),
    iat: now,
    exp: now + USER_2FA_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export async function verifyUser2faToken(token, expectedUid, { req = null, enabledAt = null } = {}) {
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
    if (
      payload.type !== 'user_2fa' ||
      payload.uid !== expectedUid ||
      !payload.exp ||
      Date.now() > payload.exp
    ) {
      return false;
    }
    if (req && payload.uaHash && payload.uaHash !== hashUa(req)) {
      return false;
    }
    if (enabledAt) {
      const enabledMs = Date.parse(enabledAt);
      if (Number.isFinite(enabledMs) && Number(payload.iat || 0) + 5000 < enabledMs) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Server-side middleware enforcing customer 2FA on sensitive endpoints whenever enabled on the account.
 */
export async function requireUser2fa(req, _res, next) {
  try {
    if (!req.user?.uid) {
      return next(new AppError('Authentication token is required', 401, 'AUTH_REQUIRED'));
    }
    const firestore = ensureDb();
    const snap = await firestore.collection('userSecurity').doc(req.user.uid).get();
    const secData = snap.exists ? snap.data() : null;
    const enabled = Boolean(secData?.enabled);
    if (!enabled) {
      return next();
    }

    const token = req.headers['x-user-2fa'];
    const ok = await verifyUser2faToken(token, req.user.uid, {
      req,
      enabledAt: secData?.enabledAt || null,
    });
    if (!ok) {
      return next(
        new AppError(
          'Two-factor authentication verification is required for this session.',
          403,
          'USER_2FA_REQUIRED'
        )
      );
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

function assertNotLocked(data) {
  const lockedUntil = Number(data?.lockedUntil || 0);
  if (lockedUntil > Date.now()) {
    const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
    throw new AppError(
      `Too many incorrect 2FA attempts. Try again in ${secs}s.`,
      429,
      'USER_2FA_LOCKED'
    );
  }
}

async function recordFailurePersisted(ref, uid, req) {
  const firestore = ensureDb();
  const now = Date.now();

  const { count, locked } = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? snap.data() || {} : {};
    const prevWindowStart = Number(cur.lockWindowStart || 0);
    const expired = !prevWindowStart || now - prevWindowStart > LOCKOUT_MS;
    const nextCount = expired ? 1 : Number(cur.failedAttempts || 0) + 1;
    const nextLockedUntil = nextCount >= MAX_2FA_FAILURES ? now + LOCKOUT_MS : 0;

    tx.set(
      ref,
      {
        failedAttempts: nextCount,
        lockWindowStart: expired ? now : prevWindowStart,
        lockedUntil: nextLockedUntil,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { count: nextCount, locked: nextLockedUntil > now };
  });

  if (locked) {
    await recordAuditEvent(req, {
      eventType: 'USER_2FA_LOCKOUT',
      severity: 'critical',
      targetType: 'user_security',
      targetId: uid,
      status: 'BLOCKED',
      details: `Locked user 2FA verification for 15m after ${count} failed attempts`,
    });
    throw new AppError(
      'Too many failed 2FA attempts. Temporarily locked for 15 minutes.',
      429,
      'USER_2FA_LOCKED'
    );
  }

  const remaining = Math.max(0, MAX_2FA_FAILURES - count);
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
    verified = await verifyUser2faToken(req.headers['x-user-2fa'], req.user.uid, {
      req,
      enabledAt: data?.enabledAt || null,
    });
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
      pendingSecret: encryptSecret(pendingSecret),
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
  const plainPendingSecret = decryptSecret(data.pendingSecret);
  const totpMatch = matchTotpStep(plainPendingSecret, totpCode, 0);
  if (!totpMatch.valid) {
    throw new AppError('Invalid 6-digit verification code.', 400, 'INVALID_TOTP');
  }

  const recoveryCodes = generateRecoveryCodes('TTU', 6);
  const recoveryHashes = recoveryCodes.map((c) => hashRecoveryCode(c));

  await ref.set({
    uid: req.user.uid,
    email: req.user.email || '',
    enabled: true,
    totpSecret: encryptSecret(plainPendingSecret),
    lastUsedTotpStep: totpMatch.step,
    recoveryHashes,
    failedAttempts: 0,
    lockWindowStart: 0,
    lockedUntil: 0,
    enabledAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const twoFactorToken = await signUser2faToken(req.user.uid, req);

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
  const firestore = ensureDb();
  const ref = firestore.collection('userSecurity').doc(req.user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;

  if (!data?.enabled) {
    const twoFactorToken = await signUser2faToken(req.user.uid, req);
    return { verified: true, enabled: false, twoFactorToken };
  }

  assertNotLocked(data);

  let usedRecovery = false;
  if (recoveryCode && String(recoveryCode).trim()) {
    const cleanRec = String(recoveryCode).trim().toUpperCase();
    const consumed = await firestore.runTransaction(async (tx) => {
      const freshSnap = await tx.get(ref);
      const freshData = freshSnap.data() || {};
      assertNotLocked(freshData);
      const hashes = Array.isArray(freshData.recoveryHashes) ? freshData.recoveryHashes : [];
      const matchIdx = findMatchingRecoveryIndex(cleanRec, hashes);
      if (matchIdx === -1) return false;
      tx.set(
        ref,
        {
          recoveryHashes: hashes.filter((_, idx) => idx !== matchIdx),
          failedAttempts: 0,
          lockWindowStart: 0,
          lockedUntil: 0,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    });

    if (!consumed) {
      const remaining = await recordFailurePersisted(ref, req.user.uid, req);
      throw new AppError(`Invalid backup recovery code (${remaining} attempts left).`, 401, 'INVALID_RECOVERY_CODE');
    }
    usedRecovery = true;
  } else {
    const plainTotpSecret = decryptSecret(data.totpSecret);
    const totpCheck = await firestore.runTransaction(async (tx) => {
      const freshSnap = await tx.get(ref);
      const freshData = freshSnap.data() || {};
      assertNotLocked(freshData);
      const matched = matchTotpStep(
        plainTotpSecret,
        totpCode,
        Number(freshData.lastUsedTotpStep || 0)
      );
      if (!matched.valid) return matched;
      const updates = {
        failedAttempts: 0,
        lockWindowStart: 0,
        lockedUntil: 0,
        lastUsedTotpStep: matched.step,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (freshData.totpSecret && !String(freshData.totpSecret).startsWith('enc:v1:')) {
        updates.totpSecret = encryptSecret(plainTotpSecret);
      }
      tx.set(ref, updates, { merge: true });
      return matched;
    });

    if (!totpCheck.valid) {
      const remaining = await recordFailurePersisted(ref, req.user.uid, req);
      throw new AppError(
        totpCheck.replayed
          ? `This 6-digit code was already used. Wait for the next code (${remaining} attempts left).`
          : `Invalid 6-digit verification code (${remaining} attempts left).`,
        401,
        'INVALID_TOTP'
      );
    }
  }

  const twoFactorToken = await signUser2faToken(req.user.uid, req);

  await recordAuditEvent(req, {
    eventType: 'USER_2FA_VERIFIED',
    severity: usedRecovery ? 'warning' : 'info',
    targetType: 'user_security',
    targetId: req.user.uid,
    status: 'SUCCESS',
    details: usedRecovery
      ? 'User 2FA verified with one-time recovery code'
      : 'User 2FA verified with Authenticator code',
  });

  return { verified: true, enabled: true, twoFactorToken };
}

export async function disableUser2fa(req, { totpCode, recoveryCode } = {}) {
  const firestore = ensureDb();
  const ref = firestore.collection('userSecurity').doc(req.user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;

  if (!data?.enabled) {
    return { enabled: false };
  }

  assertNotLocked(data);

  const disabledOk = await firestore.runTransaction(async (tx) => {
    const freshSnap = await tx.get(ref);
    const freshData = freshSnap.data() || {};
    if (!freshData.enabled) return true;
    assertNotLocked(freshData);

    let valid = false;
    if (recoveryCode && String(recoveryCode).trim()) {
      const hashes = Array.isArray(freshData.recoveryHashes) ? freshData.recoveryHashes : [];
      valid = findMatchingRecoveryIndex(recoveryCode, hashes) !== -1;
    } else {
      const plainSecret = decryptSecret(freshData.totpSecret);
      valid = matchTotpStep(
        plainSecret,
        totpCode,
        Number(freshData.lastUsedTotpStep || 0)
      ).valid;
    }

    if (!valid) return false;

    // Atomically wipe TOTP secret & all recovery codes upon disable
    tx.set(ref, {
      uid: req.user.uid,
      email: req.user.email || '',
      enabled: false,
      failedAttempts: 0,
      lockWindowStart: 0,
      lockedUntil: 0,
      disabledAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!disabledOk) {
    const remaining = await recordFailurePersisted(ref, req.user.uid, req);
    throw new AppError(
      `Verification code required to disable 2FA (${remaining} attempts left).`,
      401,
      'INVALID_TOTP'
    );
  }

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
