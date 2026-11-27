import crypto from 'node:crypto';
import { getClientIp, recordAuditEvent } from './auditService.js';

let cachedSigningKey = null;
const alertCooldowns = new Map();

/**
 * Derives a dedicated 256-bit HMAC key strictly from PAYMENT_HMAC_SECRET (fails closed in production).
 */
function getSigningKey() {
  if (cachedSigningKey) return cachedSigningKey;

  let entropy = String(process.env.PAYMENT_HMAC_SECRET || '').trim();
  if (entropy.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PAYMENT_HMAC_SECRET (at least 32 characters) must be configured in production.');
    }
    entropy = String(process.env.ADMIN_VAULT_SECRET || process.env.JWT_SECRET || '').trim();
    if (entropy.length < 16) {
      entropy = crypto.randomBytes(32).toString('hex');
    }
  }

  cachedSigningKey = crypto
    .createHash('sha256')
    .update(`techtonic-payment-hmac-v3:${entropy}`)
    .digest();
  return cachedSigningKey;
}

/**
 * Builds a canonical SHA-256 digest of cart items, promo code, and shipping selection to prevent cart/price tampering after QR creation.
 */
export function buildCartDigest(items = [], promoCode = null, deliveryPartner = null, shippingFee = null) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item.id || item.productId || '').trim(),
      qty: Number(item.quantity) || 0,
      variant: item.variant || item.selectedVariant || null,
    }))
    .sort((a, b) => `${a.id}:${JSON.stringify(a.variant)}`.localeCompare(`${b.id}:${JSON.stringify(b.variant)}`));

  const payload = JSON.stringify({
    items: normalized,
    promoCode: promoCode ? String(promoCode).trim().toUpperCase() : null,
    ...(deliveryPartner != null || shippingFee != null
      ? {
          deliveryPartner: deliveryPartner ? String(deliveryPartner).trim() : null,
          shippingFee: Number(Number(shippingFee || 0).toFixed(2)),
        }
      : {}),
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

function canonicalPaymentString(payment = {}) {
  return [
    String(payment.transactionId || payment.id || '').trim(),
    String(payment.md5Hash || '').trim(),
    Number(payment.amount || 0).toFixed(4),
    String(payment.currency || 'USD').trim().toUpperCase(),
    String(payment.userId || '').trim(),
    String(payment.verifiedBy || '').trim(),
    String(payment.paidAt || '').trim(),
    Number(payment.expectedTotalUsd ?? payment.amount ?? 0).toFixed(4),
    String(payment.cartDigest || '').trim(),
  ].join('|');
}

/**
 * Generates a tamper-evident HMAC-SHA256 proof binding verified payment state, amount, user, and cart digest.
 */
export function signPaymentProof(payment = {}) {
  return crypto
    .createHmac('sha256', getSigningKey())
    .update(canonicalPaymentString(payment))
    .digest('hex');
}

/**
 * Verifies the server HMAC-SHA256 proof using timing-safe comparison.
 */
export function verifyPaymentProof(payment = {}) {
  const provided = String(payment?.verificationProof || '').trim();
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;

  const expected = signPaymentProof(payment);
  const a = Buffer.from(provided, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Computes a tamper-evident integrity hash stored on confirmed order records.
 */
export function signOrderIntegrity({ orderId, userId, total, transactionId, verifiedBy, promoCode }) {
  const canonical = [
    String(orderId || '').trim(),
    String(userId || '').trim(),
    Number(total || 0).toFixed(2),
    String(transactionId || '').trim(),
    String(verifiedBy || '').trim(),
    String(promoCode || '').trim().toUpperCase(),
  ].join('|');

  return crypto.createHmac('sha256', getSigningKey()).update(canonical).digest('hex');
}

/**
 * Timing-safe string comparison for webhook secret headers.
 */
export function timingSafeTokenEqual(provided, expected) {
  const aStr = String(provided || '');
  const bStr = String(expected || '');
  if (!aStr || !bStr) return false;
  const a = crypto.createHash('sha256').update(aStr).digest();
  const b = crypto.createHash('sha256').update(bStr).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Logs a critical audit trail and dispatches an instant rate-limited Telegram security alert on bypass attempts.
 */
export async function reportPaymentSecurityIncident(
  reqOrUser,
  { reason = 'PAYMENT_BYPASS_ATTEMPT', details = '', transactionId = null, severity = 'critical' } = {}
) {
  const isReq = Boolean(reqOrUser && (reqOrUser.headers || reqOrUser.originalUrl || reqOrUser.method));
  const req = isReq ? reqOrUser : null;
  const user = req ? req.user : reqOrUser?.user || reqOrUser || null;

  await recordAuditEvent(req || {}, {
    eventType: reason,
    severity,
    actorUid: user?.uid || null,
    actorEmail: user?.email || null,
    targetType: 'payment',
    targetId: transactionId || null,
    status: 'BLOCKED',
    details,
  });

  const actorKey = getClientIp(req) || user?.uid || 'anon';
  const cooldownKey = `${reason}:${actorKey}`;
  const now = Date.now();
  const lastSent = alertCooldowns.get(cooldownKey) || 0;
  if (now - lastSent < 30000) return;
  if (alertCooldowns.size > 2000) {
    alertCooldowns.clear();
  }
  alertCooldowns.set(cooldownKey, now);

  try {
    const { notifySecurityAlert } = await import('./telegramService.js');
    await notifySecurityAlert({
      reason,
      details,
      transactionId,
      actorEmail: user?.email || null,
      actorUid: user?.uid || null,
      ip: req ? getClientIp(req) : null,
    });
  } catch {
    // Non-fatal alert error
  }
}
