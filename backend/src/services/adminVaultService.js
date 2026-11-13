import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { getClientIp, getUserAgent, recordAuditEvent } from './auditService.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const VAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_VAULT_FAILURES = 3;
const VAULT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

let cachedSigningSecret = null;
const failureBuckets = new Map();
const revokedTokens = new Set();

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

export function verifyTotpCode(secretBase32, candidateCode) {
  const clean = String(candidateCode || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  for (const offset of [-1, 0, 1]) {
    const expected = generateTotpCode(secretBase32, offset);
    if (crypto.timingSafeEqual(Buffer.from(clean), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
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

export async function getSigningSecret() {
  if (process.env.ADMIN_VAULT_SECRET && process.env.ADMIN_VAULT_SECRET.length >= 24) {
    return process.env.ADMIN_VAULT_SECRET;
  }
  if (cachedSigningSecret) return cachedSigningSecret;

  const firestore = ensureDb();
  const ref = firestore.collection('systemConfig').doc('adminVaultKey');
  const snap = await ref.get();
  if (snap.exists && snap.data()?.secret) {
    cachedSigningSecret = snap.data().secret;
    return cachedSigningSecret;
  }

  const generated = crypto.randomBytes(32).toString('hex');
  await ref.set({ secret: generated, createdAt: new Date().toISOString() });
  cachedSigningSecret = generated;
  return generated;
}

async function signVaultToken(payload) {
  const secret = await getSigningSecret();
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${sig}`;
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

  if (revokedTokens.has(payload.jti)) {
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

function getAttemptBucketKey(uid, req) {
  return `${uid}:${getClientIp(req)}`;
}

function checkLockout(uid, req) {
  const key = getAttemptBucketKey(uid, req);
  const entry = failureBuckets.get(key);
  if (entry && entry.lockedUntil > Date.now()) {
    const secs = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    throw new AppError(
      `Admin vault temporarily locked after repeated failures. Retry in ${secs}s.`,
      429,
      'ADMIN_VAULT_LOCKED'
    );
  }
}

async function recordFailure(uid, req, reasonCode) {
  const key = getAttemptBucketKey(uid, req);
  const now = Date.now();
  let entry = failureBuckets.get(key);
  if (!entry || now - entry.windowStart > VAULT_LOCKOUT_MS) {
    entry = { count: 0, windowStart: now, lockedUntil: 0 };
  }
  entry.count += 1;

  if (entry.count >= MAX_VAULT_FAILURES) {
    entry.lockedUntil = now + VAULT_LOCKOUT_MS;
    failureBuckets.set(key, entry);
    await recordAuditEvent(req, {
      eventType: 'ADMIN_VAULT_LOCKOUT',
      severity: 'critical',
      targetType: 'admin_vault',
      targetId: uid,
      status: 'BLOCKED',
      details: `Locked admin vault for 15m after ${entry.count} failed attempts (${reasonCode})`,
    });
    throw new AppError(
      'Too many invalid security attempts! Admin vault locked for 15 minutes.',
      429,
      'ADMIN_VAULT_LOCKED'
    );
  }

  failureBuckets.set(key, entry);
  const remaining = MAX_VAULT_FAILURES - entry.count;
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

function clearFailures(uid, req) {
  failureBuckets.delete(getAttemptBucketKey(uid, req));
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

  const key = getAttemptBucketKey(req.user.uid, req);
  const lockEntry = failureBuckets.get(key);
  const lockedSeconds =
    lockEntry && lockEntry.lockedUntil > Date.now()
      ? Math.ceil((lockEntry.lockedUntil - Date.now()) / 1000)
      : 0;

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
      pendingSecret,
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
 * Locks in Layer 2 (Master Security PIN) + Layer 3 (TOTP 2FA) + Layer 5 Recovery Codes.
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

  if (!verifyTotpCode(data.pendingSecret, totpCode)) {
    throw new AppError('Invalid 6-digit Authenticator code. Please check your device time and try again.', 400, 'INVALID_TOTP');
  }

  const { salt, hash } = hashPin(cleanPin);
  const recoveryCodes = Array.from({ length: 6 }, () => {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TTV-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
  const recoveryHashes = recoveryCodes.map((c) => sha256Hex(c));

  const nowIso = new Date().toISOString();
  await ref.set({
    uid: req.user.uid,
    email: req.user.email || '',
    configured: true,
    pinSalt: salt,
    pinHash: hash,
    totpSecret: data.pendingSecret,
    recoveryHashes,
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
 * Verifies Layer 2 (Master PIN) + Layer 3 (TOTP 2FA OR single-use Recovery Code) and issues Layer 4 Vault Token.
 */
export async function unlockVault(req, { pin, totpCode, recoveryCode } = {}) {
  checkLockout(req.user.uid, req);

  const firestore = ensureDb();
  const ref = firestore.collection('adminSecurity').doc(req.user.uid);
  const snap = await ref.get();
  if (!snap.exists || !snap.data()?.configured) {
    throw new AppError('Admin 5-Layer Security is not yet configured.', 428, 'VAULT_SETUP_REQUIRED');
  }

  const data = snap.data();
  const { hash: providedPinHash } = hashPin(String(pin || '').trim(), data.pinSalt);

  if (!timingSafeEqualHex(providedPinHash, data.pinHash)) {
    const remaining = await recordFailure(req.user.uid, req, 'INVALID_MASTER_PIN');
    throw new AppError(`Invalid Master PIN (${remaining} attempt(s) left before lockout).`, 401, 'INVALID_MASTER_PIN');
  }

  let usedRecoveryHash = null;
  if (recoveryCode && String(recoveryCode).trim()) {
    const cleanRec = String(recoveryCode).trim().toUpperCase();
    const recHash = sha256Hex(cleanRec);
    const list = Array.isArray(data.recoveryHashes) ? data.recoveryHashes : [];
    if (!list.includes(recHash)) {
      const remaining = await recordFailure(req.user.uid, req, 'INVALID_RECOVERY_CODE');
      throw new AppError(`Invalid backup recovery code (${remaining} attempt(s) left).`, 401, 'INVALID_RECOVERY_CODE');
    }
    usedRecoveryHash = recHash;
  } else {
    if (!verifyTotpCode(data.totpSecret, totpCode)) {
      const remaining = await recordFailure(req.user.uid, req, 'INVALID_TOTP_CODE');
      throw new AppError(`Invalid 6-digit Authenticator code (${remaining} attempt(s) left before lockout).`, 401, 'INVALID_TOTP');
    }
  }

  clearFailures(req.user.uid, req);

  const updates = {
    lastUnlockedAt: new Date().toISOString(),
    lastUnlockedIp: getClientIp(req),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (usedRecoveryHash) {
    updates.recoveryHashes = (data.recoveryHashes || []).filter((h) => h !== usedRecoveryHash);
  }
  await ref.set(updates, { merge: true });

  const session = await issueSessionForUser(req.user, req);

  await recordAuditEvent(req, {
    eventType: 'ADMIN_VAULT_UNLOCKED',
    severity: usedRecoveryHash ? 'warning' : 'info',
    targetType: 'admin_vault',
    targetId: req.user.uid,
    status: 'SUCCESS',
    details: usedRecoveryHash
      ? 'Admin vault unlocked using one-time backup recovery code'
      : 'Admin vault unlocked via 5-Layer PIN + TOTP 2FA verification',
  });

  return session;
}

/**
 * Revokes current Admin Vault token immediately.
 */
export async function lockVault(req) {
  const token = req.headers['x-admin-vault'];
  if (token) {
    const check = await verifySignedVaultToken(token, req);
    if (check.valid && check.payload?.jti) {
      revokedTokens.add(check.payload.jti);
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
