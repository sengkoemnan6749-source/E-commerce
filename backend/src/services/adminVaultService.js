import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { getClientIp, getUserAgent, recordAuditEvent } from './auditService.js';
import {
  decryptSecret,
  encryptSecret,
  findMatchingRecoveryIndex,
  generateRecoveryCodes,
  hashRecoveryCode,
} from '../utils/cryptoSecrets.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const VAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_VAULT_FAILURES = 3;
const VAULT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

let cachedSigningSecret = null;
const revokedTokenCache = new Set();

function ensureDb() {
  if (!db) {
    throw new AppError('Database is unavailable', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function timingSafeEqualHex(hexA, hexB) {
  if (!hexA || !hexB || hexA.length !== hexB.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hexA, 'hex'), Buffer.from(hexB, 'hex'));
}

export function generateBase32Secret(byteLength = 20) {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function decodeBase32(secret) {
  const clean = String(secret || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/**
 * Standard RFC 6238 TOTP generator (6 digits, 30-second window, HMAC-SHA1).
 */
export function generateTotpCode(secretBase32, counterOffset = 0, timestampMs = Date.now()) {
  const key = decodeBase32(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / 30) + counterOffset;
  const counterBuf = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuf.writeUInt32BE(high, 0);
  counterBuf.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, '0');
}

export function matchTotpStep(secretBase32, candidateCode, lastUsedStep = 0, timestampMs = Date.now()) {
  const clean = String(candidateCode || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return { valid: false, step: 0, replayed: false };
  const baseStep = Math.floor(timestampMs / 1000 / 30);
  for (const offset of [-1, 0, 1]) {
    const expected = generateTotpCode(secretBase32, offset, timestampMs);
    if (crypto.timingSafeEqual(Buffer.from(clean), Buffer.from(expected))) {
      const matchedStep = baseStep + offset;
      if (Number(lastUsedStep || 0) >= matchedStep) {
        return { valid: false, step: matchedStep, replayed: true };
      }
      return { valid: true, step: matchedStep, replayed: false };
    }
  }
  return { valid: false, step: 0, replayed: false };
}

export function verifyTotpCode(secretBase32, candidateCode, lastUsedStep = 0) {
  return matchTotpStep(secretBase32, candidateCode, lastUsedStep).valid;
}

function hashPin(pin, saltHex) {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return { salt, hash: derived };
}

function isWeakAdminPin(pin) {
  const s = String(pin || '').trim();
  if (s.length < 6) return true;
  if (/^([a-zA-Z0-9])\1+$/.test(s)) return true;
  const banned = new Set(['123456', '654321', '12345678', '000000', '111111', 'password', 'admin123', 'techtonic']);
  return banned.has(s.toLowerCase());
}

/**
 * Loads dedicated ADMIN_VAULT_SECRET from environment (never writes plaintext signing key to Firestore).
 */
export async function getSigningSecret() {
  const envSecret = String(process.env.ADMIN_VAULT_SECRET || '').trim();
  if (envSecret.length >= 24) {
    return envSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new AppError(
      'ADMIN_VAULT_SECRET (at least 24 characters) must be configured in production.',
      500,
      'SERVER_MISCONFIGURED'
    );
  }
  if (!cachedSigningSecret) {
    const devSeed = String(process.env.PAYMENT_HMAC_SECRET || process.env.JWT_SECRET || '').trim();
    cachedSigningSecret =
      devSeed.length >= 16
        ? sha256Hex(`dev-vault-secret:${devSeed}`)
        : crypto.randomBytes(32).toString('hex');
  }
  return cachedSigningSecret;
}

async function signVaultToken(payload) {
  const secret = await getSigningSecret();
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${sig}`;
}

async function isTokenRevoked(jti) {
  if (!jti) return true;
  if (revokedTokenCache.has(jti)) return true;
  if (!db) return false;
  try {
    const snap = await db.collection('adminVaultRevocations').doc(String(jti)).get();
    if (snap.exists) {
      revokedTokenCache.add(jti);
      return true;
    }
  } catch {
    // Non-fatal fallback
  }
  return false;
}

export async function verifySignedVaultToken(token, req) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, code: 'MISSING_VAULT_TOKEN', message: 'Admin security verification is required.' };
  }

  const [encodedPayload, providedSig] = token.split('.');
  if (!encodedPayload || !providedSig) {
    return { valid: false, code: 'MALFORMED_VAULT_TOKEN', message: 'Invalid admin vault token.' };
  }

  const secret = await getSigningSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))
  ) {
    return { valid: false, code: 'INVALID_VAULT_SIGNATURE', message: 'Invalid admin security signature.' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, code: 'INVALID_VAULT_PAYLOAD', message: 'Corrupted admin vault token.' };
  }

  if (payload.uid !== req.user?.uid) {
    return { valid: false, code: 'VAULT_UID_MISMATCH', message: 'Admin vault session belongs to a different account.' };
  }

  if (await isTokenRevoked(payload.jti)) {
    return { valid: false, code: 'VAULT_REVOKED', message: 'Admin vault session was locked. Please verify again.' };
  }

  if (!payload.exp || Date.now() > payload.exp) {
    return { valid: false, code: 'VAULT_EXPIRED', message: 'Admin security session expired. Please re-verify.' };
  }

  const currentIpHash = sha256Hex(getClientIp(req));
  const currentUaHash = sha256Hex(getUserAgent(req));
  if (payload.ipHash !== currentIpHash || payload.uaHash !== currentUaHash) {
    return {
      valid: false,
      code: 'ADMIN_DEVICE_MISMATCH',
      message: 'Session blocked: IP address or browser device changed after unlock.',
    };
  }

  return { valid: true, payload };
}

function assertNotLocked(data) {
  const lockedUntil = Number(data?.lockedUntil || 0);
  if (lockedUntil > Date.now()) {
    const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
    throw new AppError(
      `Admin vault temporarily locked after repeated failures. Retry in ${secs}s.`,
      429,
      'ADMIN_VAULT_LOCKED'
    );
  }
}

async function recordFailurePersisted(ref, uid, req, reasonCode) {
  const firestore = ensureDb();
  const now = Date.now();

  const { count, locked } = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? snap.data() || {} : {};
    const prevWindowStart = Number(cur.lockWindowStart || 0);
    const expiredWindow = !prevWindowStart || now - prevWindowStart > VAULT_LOCKOUT_MS;
    const nextCount = expiredWindow ? 1 : Number(cur.failedAttempts || 0) + 1;
    const nextLockedUntil = nextCount >= MAX_VAULT_FAILURES ? now + VAULT_LOCKOUT_MS : 0;

    tx.set(
      ref,
      {
        failedAttempts: nextCount,
        lockWindowStart: expiredWindow ? now : prevWindowStart,
        lockedUntil: nextLockedUntil,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { count: nextCount, locked: nextLockedUntil > now };
  });

  if (locked) {
    await recordAuditEvent(req, {
      eventType: 'ADMIN_VAULT_LOCKOUT',
      severity: 'critical',
      targetType: 'admin_vault',
      targetId: uid,
      status: 'BLOCKED',
      details: `Locked admin vault for 15m after ${count} failed attempts (${reasonCode})`,
    });
    throw new AppError(
      'Too many invalid security attempts! Admin vault locked for 15 minutes.',
      429,
      'ADMIN_VAULT_LOCKED'
    );
  }

  const remaining = Math.max(0, MAX_VAULT_FAILURES - count);
  await recordAuditEvent(req, {
    eventType: 'ADMIN_VAULT_FAILED',
    severity: 'warning',
    targetType: 'admin_vault',
    targetId: uid,
    status: 'FAILED',
    details: `Invalid admin verification (${reasonCode}). ${remaining} attempt(s) remaining before 15m lockout.`,
  });
  return remaining;
}

async function issueSessionForUser(user, req) {
  const jti = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const exp = now + VAULT_TTL_MS;
  const vaultToken = await signVaultToken({
    jti,
    uid: user.uid,
    email: user.email || '',
    ipHash: sha256Hex(getClientIp(req)),
    uaHash: sha256Hex(getUserAgent(req)),
    iat: now,
    exp,
  });
  return { vaultToken, expiresAt: new Date(exp).toISOString(), ttlSeconds: VAULT_TTL_MS / 1000 };
}

/**
 * Layer 1-5 status check for the currently authenticated Admin.
 */
export async function getVaultStatus(req) {
  const firestore = ensureDb();
  const snap = await firestore.collection('adminSecurity').doc(req.user.uid).get();
  const data = snap.exists ? snap.data() : null;
  const configured = Boolean(data?.configured);

  const tokenHeader = req.headers['x-admin-vault'];
  let unlocked = false;
  let expiresAt = null;

  if (configured && tokenHeader) {
    const check = await verifySignedVaultToken(tokenHeader, req);
    if (check.valid) {
      unlocked = true;
      expiresAt = new Date(check.payload.exp).toISOString();
    }
  }

  const lockedUntil = Number(data?.lockedUntil || 0);
  const lockedSeconds = lockedUntil > Date.now() ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;

  return {
    configured,
    unlocked,
    expiresAt,
    lockedSeconds,
    remainingRecoveryCodes: Array.isArray(data?.recoveryHashes) ? data.recoveryHashes.length : 0,
    lastUnlockedAt: data?.lastUnlockedAt || null,
    lastUnlockedIp: data?.lastUnlockedIp || null,
  };
}

/**
 * Generates a TOTP secret & local QR data URI for first-time Admin Vault enrollment.
 */
export async function beginVaultSetup(req, QRCode) {
  const firestore = ensureDb();
  const ref = firestore.collection('adminSecurity').doc(req.user.uid);
  const snap = await ref.get();

  if (snap.exists && snap.data()?.configured) {
    throw new AppError(
      'Admin 5-Layer Security is already configured and locked. Unlock first or reset via Firebase Console.',
      409,
      'VAULT_ALREADY_CONFIGURED'
    );
  }

  const pendingSecret = generateBase32Secret(20);
  const accountLabel = req.user.email || req.user.uid;
  const otpauthUrl = `otpauth://totp/TechTonic%20Admin:${encodeURIComponent(accountLabel)}?secret=${pendingSecret}&issuer=TechTonic%20Store&algorithm=SHA1&digits=6&period=30`;
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 220, margin: 1 });

  await ref.set(
    {
      uid: req.user.uid,
      email: req.user.email || '',
      configured: false,
      pendingSecret: encryptSecret(pendingSecret),
      pendingExpiresAt: Date.now() + 10 * 60 * 1000,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    secret: pendingSecret,
    otpauthUrl,
    qrDataUrl,
  };
}

/**
 * Locks in Layer 2 (Master Security PIN) + Layer 3 (Encrypted TOTP 2FA) + Layer 5 scrypt Recovery Codes.
 */
export async function confirmVaultSetup(req, { pin, totpCode } = {}) {
  const firestore = ensureDb();
  const ref = firestore.collection('adminSecurity').doc(req.user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;

  if (data?.configured) {
    throw new AppError('Admin 5-Layer Security is already configured.', 409, 'VAULT_ALREADY_CONFIGURED');
  }

  if (!data?.pendingSecret || !data?.pendingExpiresAt || Date.now() > data.pendingExpiresAt) {
    throw new AppError('Setup QR session expired. Please generate a new QR code.', 400, 'SETUP_EXPIRED');
  }

  const cleanPin = String(pin || '').trim();
  if (isWeakAdminPin(cleanPin)) {
    throw new AppError(
      'Admin Master PIN must be at least 6 characters and cannot be a common pattern (e.g. 123456).',
      400,
      'WEAK_ADMIN_PIN'
    );
  }

  const plainPendingSecret = decryptSecret(data.pendingSecret);
  const totpMatch = matchTotpStep(plainPendingSecret, totpCode, 0);
  if (!totpMatch.valid) {
    throw new AppError('Invalid 6-digit Authenticator code. Please check your device time and try again.', 400, 'INVALID_TOTP');
  }

  const { salt, hash } = hashPin(cleanPin);
  const recoveryCodes = generateRecoveryCodes('TTV', 6);
  const recoveryHashes = recoveryCodes.map((c) => hashRecoveryCode(c));

  const nowIso = new Date().toISOString();
  await ref.set({
    uid: req.user.uid,
    email: req.user.email || '',
    configured: true,
    pinSalt: salt,
    pinHash: hash,
    totpSecret: encryptSecret(plainPendingSecret),
    lastUsedTotpStep: totpMatch.step,
    recoveryHashes,
    failedAttempts: 0,
    lockWindowStart: 0,
    lockedUntil: 0,
    configuredAt: nowIso,
    lastUnlockedAt: nowIso,
    lastUnlockedIp: getClientIp(req),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const session = await issueSessionForUser(req.user, req);

  await recordAuditEvent(req, {
    eventType: 'ADMIN_VAULT_CONFIGURED',
    severity: 'info',
    targetType: 'admin_vault',
    targetId: req.user.uid,
    status: 'SUCCESS',
    details: '5-Layer Admin Security Vault (Master PIN + TOTP 2FA + Device Lock) enabled',
  });

  return {
    ...session,
    recoveryCodes,
  };
}

/**
 * Verifies Layer 2 (Master PIN) + Layer 3 (TOTP 2FA OR single-use atomic Recovery Code) and issues Layer 4 Vault Token.
 */
export async function unlockVault(req, { pin, totpCode, recoveryCode } = {}) {
  const firestore = ensureDb();
  const ref = firestore.collection('adminSecurity').doc(req.user.uid);
  const snap = await ref.get();
  if (!snap.exists || !snap.data()?.configured) {
    throw new AppError('Admin 5-Layer Security is not yet configured.', 428, 'VAULT_SETUP_REQUIRED');
  }

  const data = snap.data();
  assertNotLocked(data);

  const { hash: providedPinHash } = hashPin(String(pin || '').trim(), data.pinSalt);
  if (!timingSafeEqualHex(providedPinHash, data.pinHash)) {
    const remaining = await recordFailurePersisted(ref, req.user.uid, req, 'INVALID_MASTER_PIN');
    throw new AppError(`Invalid Master PIN (${remaining} attempt(s) left before lockout).`, 401, 'INVALID_MASTER_PIN');
  }

  let usedRecovery = false;
  if (recoveryCode && String(recoveryCode).trim()) {
    const cleanRec = String(recoveryCode).trim().toUpperCase();
    const consumed = await firestore.runTransaction(async (tx) => {
      const freshSnap = await tx.get(ref);
      const freshData = freshSnap.data() || {};
      assertNotLocked(freshData);
      const list = Array.isArray(freshData.recoveryHashes) ? freshData.recoveryHashes : [];
      const matchIdx = findMatchingRecoveryIndex(cleanRec, list);
      if (matchIdx === -1) return false;

      const remainingHashes = list.filter((_, idx) => idx !== matchIdx);
      tx.set(
        ref,
        {
          recoveryHashes: remainingHashes,
          failedAttempts: 0,
          lockWindowStart: 0,
          lockedUntil: 0,
          lastUnlockedAt: new Date().toISOString(),
          lastUnlockedIp: getClientIp(req),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    });

    if (!consumed) {
      const remaining = await recordFailurePersisted(ref, req.user.uid, req, 'INVALID_RECOVERY_CODE');
      throw new AppError(`Invalid backup recovery code (${remaining} attempt(s) left).`, 401, 'INVALID_RECOVERY_CODE');
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
      if (!matched.valid) {
        return matched;
      }
      const updates = {
        failedAttempts: 0,
        lockWindowStart: 0,
        lockedUntil: 0,
        lastUsedTotpStep: matched.step,
        lastUnlockedAt: new Date().toISOString(),
        lastUnlockedIp: getClientIp(req),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (freshData.totpSecret && !String(freshData.totpSecret).startsWith('enc:v1:')) {
        updates.totpSecret = encryptSecret(plainTotpSecret);
      }
      tx.set(ref, updates, { merge: true });
      return matched;
    });

    if (!totpCheck.valid) {
      const reason = totpCheck.replayed ? 'REPLAYED_TOTP_CODE' : 'INVALID_TOTP_CODE';
      const remaining = await recordFailurePersisted(ref, req.user.uid, req, reason);
      throw new AppError(
        totpCheck.replayed
          ? `This 6-digit code was already used. Wait for the next code (${remaining} attempt(s) left).`
          : `Invalid 6-digit Authenticator code (${remaining} attempt(s) left before lockout).`,
        401,
        'INVALID_TOTP'
      );
    }
  }

  const session = await issueSessionForUser(req.user, req);

  await recordAuditEvent(req, {
    eventType: 'ADMIN_VAULT_UNLOCKED',
    severity: usedRecovery ? 'warning' : 'info',
    targetType: 'admin_vault',
    targetId: req.user.uid,
    status: 'SUCCESS',
    details: usedRecovery
      ? 'Admin vault unlocked using one-time backup recovery code'
      : 'Admin vault unlocked via 5-Layer PIN + TOTP 2FA verification',
  });

  return session;
}

/**
 * Revokes current Admin Vault token immediately and persists revocation across restarts/instances.
 */
export async function lockVault(req) {
  const token = req.headers['x-admin-vault'];
  if (token) {
    const check = await verifySignedVaultToken(token, req);
    if (check.valid && check.payload?.jti) {
      const jti = String(check.payload.jti);
      revokedTokenCache.add(jti);
      if (db) {
        await db
          .collection('adminVaultRevocations')
          .doc(jti)
          .set({
            uid: req.user?.uid || null,
            revokedAt: new Date().toISOString(),
            expiresAt: check.payload.exp || Date.now() + VAULT_TTL_MS,
          })
          .catch(() => {});
      }
    }
  }
  await recordAuditEvent(req, {
    eventType: 'ADMIN_VAULT_LOCKED',
    severity: 'info',
    targetType: 'admin_vault',
    targetId: req.user?.uid || null,
    status: 'SUCCESS',
    details: 'Admin vault manually locked by administrator',
  });
  return { locked: true };
}
