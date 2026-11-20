import crypto from 'node:crypto';
import { AppError } from '../middleware/errorHandler.js';

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Reads LuyRiel API configuration from environment variables.
 */
export function getLuyrielConfig() {
  return {
    apiUrl: String(process.env.LUYRIEL_API_URL || 'https://apiaba.lorndavid.online')
      .trim()
      .replace(/\/+$/, ''),
    apiKey: String(process.env.LUYRIEL_API_KEY || '').trim(),
    webhookSecret: String(process.env.LUYRIEL_WEBHOOK_SECRET || '').trim(),
    merchantLabel: String(process.env.LUYRIEL_MERCHANT_LABEL || 'ABA PayWay KHQR').trim(),
  };
}

/**
 * Returns true when a LuyRiel API secret key is configured on the backend.
 */
export function isLuyrielConfigured() {
  return Boolean(getLuyrielConfig().apiKey);
}

/**
 * Unwraps LuyRiel API payloads whether wrapped under `data` or returned at top level.
 */
function unwrapPayload(json) {
  if (!json || typeof json !== 'object') return {};
  if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
    return json.data;
  }
  return json;
}

async function luyrielRequest(path, { method = 'GET', body = null, headers = {} } = {}, config = getLuyrielConfig()) {
  if (!config.apiKey) {
    throw new AppError(
      'LUYRIEL_API_KEY is not configured on the backend server.',
      503,
      'LUYRIEL_NOT_CONFIGURED'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...headers,
      },
      ...(body !== null ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (res.status === 401 || res.status === 403) {
      throw new AppError(
        json?.error?.message || json?.message || 'LuyRiel API key is invalid or unauthorized.',
        502,
        'LUYRIEL_UNAUTHORIZED'
      );
    }

    if (res.status === 429) {
      throw new AppError(
        'LuyRiel API rate limit reached. Please retry in a few seconds.',
        429,
        'LUYRIEL_RATE_LIMITED'
      );
    }

    if (!res.ok) {
      const msg =
        json?.error?.message ||
        json?.message ||
        `LuyRiel API returned HTTP ${res.status}`;
      throw new AppError(msg, 502, json?.error?.code || 'LUYRIEL_API_ERROR');
    }

    return json || {};
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      err?.name === 'AbortError'
        ? 'LuyRiel payment gateway request timed out.'
        : `Unable to reach LuyRiel API: ${err?.message || 'Network error'}`,
      502,
      'LUYRIEL_UNREACHABLE'
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Creates a dynamic ABA PayWay KHQR payment order via POST /api/v1/payments.
 */
export async function createLuyrielPayment({
  amount,
  currency = 'USD',
  orderId,
  description = 'TechTonic Store Order',
}) {
  const config = getLuyrielConfig();
  const normalizedCurrency = String(currency || 'USD').trim().toUpperCase() === 'KHR' ? 'KHR' : 'USD';
  const normalizedAmount =
    normalizedCurrency === 'KHR'
      ? Math.max(1, Math.round(Number(amount || 0)))
      : Math.round(Number(amount || 0) * 100) / 100;

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError('Payment amount must be greater than zero.', 400, 'INVALID_AMOUNT');
  }

  const json = await luyrielRequest(
    '/api/v1/payments',
    {
      method: 'POST',
      headers: orderId ? { 'Idempotency-Key': String(orderId).trim() } : {},
      body: {
        amount: normalizedAmount,
        currency: normalizedCurrency,
        order_id: String(orderId || '').trim(),
        description: String(description || 'TechTonic Store Order').trim().slice(0, 200),
      },
    },
    config
  );

  const data = unwrapPayload(json);
  const khqrObj = data?.khqr && typeof data.khqr === 'object' ? data.khqr : {};
  const qrObj = data?.qr && typeof data.qr === 'object' ? data.qr : {};
  const khqrString = String(
    qrObj.string || khqrObj.qr_string || data.qr_string || data.qrString || ''
  ).trim();
  const luyrielPaymentId = String(data.id || data.payment_id || data.tran_id || '').trim();

  if (!luyrielPaymentId || !khqrString) {
    throw new AppError(
      'LuyRiel API did not return a valid payment ID or KHQR payload.',
      502,
      'LUYRIEL_INVALID_RESPONSE'
    );
  }

  return {
    luyrielPaymentId,
    orderId: String(data.order_id || orderId || '').trim(),
    status: String(data.status || 'PENDING').trim().toUpperCase(),
    amount: Number(data.amount ?? normalizedAmount),
    currency: String(data.currency || normalizedCurrency).trim().toUpperCase(),
    khqrString,
    md5Hash: qrObj.md5 || khqrObj.md5 || data.md5 || null,
    merchantName: data.merchant_name || null,
    checkoutUrl: data.checkout_url || null,
    createdAt: data.created_at || new Date().toISOString(),
    expiresAt: data.expires_at || null,
    raw: data,
  };
}

/**
 * Fetches live payment settlement status via GET /api/v1/payments/:id.
 */
export async function getLuyrielPaymentStatus(paymentId) {
  const cleanId = String(paymentId || '').trim();
  if (!cleanId) {
    throw new AppError('LuyRiel payment ID is required', 400, 'VALIDATION_ERROR');
  }

  const json = await luyrielRequest(`/api/v1/payments/${encodeURIComponent(cleanId)}`);
  const data = unwrapPayload(json);

  return {
    id: String(data.id || cleanId).trim(),
    orderId: data.order_id ? String(data.order_id).trim() : null,
    status: String(data.status || 'PENDING').trim().toUpperCase(),
    amount: data.amount != null ? Number(data.amount) : null,
    currency: data.currency ? String(data.currency).trim().toUpperCase() : null,
    paidAt: data.paid_at || null,
    hash: data.hash || null,
    raw: data,
  };
}

/**
 * Verifies LuyRiel's X-Signature header using HMAC-SHA512 over the raw request body.
 */
export function verifyLuyrielWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  const secret = String(webhookSecret || '').trim();
  const providedRaw = String(signatureHeader || '').trim().replace(/^sha512=/i, '');
  if (!secret || !providedRaw || !/^[a-f0-9]{128}$/i.test(providedRaw)) {
    return false;
  }

  const bodyInput = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''), 'utf8');
  const computedHex = crypto
    .createHmac('sha512', secret)
    .update(bodyInput)
    .digest('hex');

  const expectedBuf = Buffer.from(computedHex, 'hex');
  const providedBuf = Buffer.from(providedRaw, 'hex');
  return expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);
}
