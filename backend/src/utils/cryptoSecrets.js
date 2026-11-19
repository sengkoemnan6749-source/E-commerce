import crypto from 'node:crypto';

const ENC_PREFIX = 'enc:v1:';
const SCRYPT_PREFIX = 'scrypt:v1:';

let cachedDevEncKey = null;

function resolveEncryptionKey() {
  const configured = String(process.env.DATA_ENCRYPTION_KEY || '').trim();
  if (configured.length >= 32) {
    return crypto.createHash('sha256').update(`techtonic-aes-v1:${configured}`).digest();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATA_ENCRYPTION_KEY (at least 32 characters) is required in production.');
  }
  if (!cachedDevEncKey) {
    const devSeed =
      String(process.env.PAYMENT_HMAC_SECRET || '').trim() ||
      String(process.env.ADMIN_VAULT_SECRET || '').trim() ||
      String(process.env.JWT_SECRET || '').trim() ||
      'techtonic-local-dev-only-key';
    cachedDevEncKey = crypto.createHash('sha256').update(`techtonic-aes-dev:${devSeed}`).digest();
  }
  return cachedDevEncKey;
}

/**
 * Encrypts sensitive strings (TOTP seeds, bot tokens) with AES-256-GCM before storing in Firestore.
 */
export function encryptSecret(plaintext) {
  const str = String(plaintext ?? '');
  if (!str) return '';
  if (str.startsWith(ENC_PREFIX)) return str;

  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

/**
 * Decrypts AES-256-GCM secrets; transparently reads legacy plaintext values during migration.
 */
export function decryptSecret(storedValue) {
  const str = String(storedValue ?? '');
  if (!str) return '';
  if (!str.startsWith(ENC_PREFIX)) {
    return str;
  }

  const parts = str.slice(ENC_PREFIX.length).split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted secret payload');
  }

  const [ivB64, tagB64, ctB64] = parts;
  const key = resolveEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * Generates high-entropy (80-bit) one-time backup recovery codes.
 */
export function generateRecoveryCodes(prefix = 'TTV', count = 6) {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(10).toString('hex').toUpperCase();
    return `${prefix}-${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15, 20)}`;
  });
}

/**
 * Hashes a recovery code with per-code random salt using scrypt.
 */
export function hashRecoveryCode(code) {
  const clean = String(code || '').trim().toUpperCase();
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 32).toString('hex');
  return `${SCRYPT_PREFIX}${salt}:${derived}`;
}

/**
 * Constant-time verification for both modern scrypt hashes and legacy SHA-256 recovery hashes.
 */
export function verifyRecoveryCodeHash(candidateCode, storedHash) {
  const clean = String(candidateCode || '').trim().toUpperCase();
  const stored = String(storedHash || '').trim();
  if (!clean || !stored) return false;

  if (stored.startsWith(SCRYPT_PREFIX)) {
    const body = stored.slice(SCRYPT_PREFIX.length);
    const [salt, expectedHex] = body.split(':');
    if (!salt || !expectedHex || !/^[a-f0-9]{64}$/i.test(expectedHex)) return false;
    const derived = crypto.scryptSync(clean, salt, 32);
    const expected = Buffer.from(expectedHex, 'hex');
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  }

  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const legacy = crypto.createHash('sha256').update(clean).digest();
    const expected = Buffer.from(stored, 'hex');
    return legacy.length === expected.length && crypto.timingSafeEqual(legacy, expected);
  }

  return false;
}

/**
 * Finds the index of a matching recovery code hash in constant-ish scan order.
 */
export function findMatchingRecoveryIndex(candidateCode, storedHashes = []) {
  if (!Array.isArray(storedHashes) || storedHashes.length === 0) return -1;
  let matchIndex = -1;
  for (let i = 0; i < storedHashes.length; i += 1) {
    if (verifyRecoveryCodeHash(candidateCode, storedHashes[i]) && matchIndex === -1) {
      matchIndex = i;
    }
  }
  return matchIndex;
}
