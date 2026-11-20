import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordAuditEvent } from './auditService.js';
import { computeServerOrderQuote } from './orderService.js';
import {
  reportPaymentSecurityIncident,
  signPaymentProof,
  verifyPaymentProof,
} from './paymentSecurity.js';
import {
  createLuyrielPayment,
  getLuyrielConfig,
  getLuyrielPaymentStatus,
  verifyLuyrielWebhookSignature,
} from './luyrielService.js';
import {
  isOrderTelegramReady,
  pollOrderPaymentCallbacks,
  sendOrderPaymentVerificationPrompt,
} from './telegramService.js';

const ALLOWED_VERIFIERS = ['bakong_api', 'telegram_admin', 'luyriel_api', 'luyriel_webhook'];

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function getBakongConfig() {
  return {
    accountId: String(process.env.BAKONG_ACCOUNT_ID || 'seng_koemnan@bkrt').trim(),
    merchantName: String(process.env.BAKONG_MERCHANT_NAME || 'TechTonic Store').trim().slice(0, 25),
    merchantCity: String(process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh').trim().slice(0, 15),
    apiUrl: String(process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh').replace(/\/+$/, ''),
    token: String(process.env.BAKONG_TOKEN || '').trim(),
  };
}

function resolveKhqrProvider(luyrielConfig) {
  const configured = String(process.env.KHQR_PROVIDER || 'auto').trim().toLowerCase();
  if (configured === 'luyriel') return 'luyriel';
  if (configured === 'bakong') return 'bakong';
  return luyrielConfig.apiKey ? 'luyriel' : 'bakong';
}

async function validateAmountAndCurrencyMatch(
  paymentData,
  remoteAmount,
  remoteCurrency,
  { req = null, user = null, providerLabel = 'Gateway' } = {}
) {
  const expectedCurrency = String(paymentData.currency || 'USD').toUpperCase();
  const actualCurrency = String(remoteCurrency || expectedCurrency).toUpperCase();

  if (actualCurrency !== expectedCurrency) {
    await reportPaymentSecurityIncident(req || user, {
      reason: 'PAYMENT_CURRENCY_MISMATCH',
      transactionId: paymentData.transactionId,
      details: `${providerLabel} returned currency ${actualCurrency}, expected ${expectedCurrency}`,
    });
    throw new AppError('Paid currency does not match KHQR currency.', 400, 'PAYMENT_CURRENCY_MISMATCH');
  }

  const paidAmount = Number(remoteAmount ?? 0);
  const tolerance = expectedCurrency === 'USD' ? 0.005 : 1;
  if (paidAmount + tolerance < Number(paymentData.amount || 0)) {
    await reportPaymentSecurityIncident(req || user, {
      reason: 'PAYMENT_AMOUNT_MISMATCH',
      transactionId: paymentData.transactionId,
      details: `${providerLabel} underpaid ${paidAmount} ${actualCurrency} vs required ${paymentData.amount}`,
    });
    throw new AppError(
      `Paid amount (${paidAmount} ${actualCurrency}) is less than required (${paymentData.amount} ${expectedCurrency}).`,
      400,
      'UNDERPAID'
    );
  }

  return { paidAmount, currency: actualCurrency };
}

async function finalizePaidSession(
  firestore,
  paymentRef,
  fallbackData,
  { verifiedBy, paidAt, payerAccountName = null, bakongData = null, luyrielData = null }
) {
  return firestore.runTransaction(async (tx) => {
    const fresh = await tx.get(paymentRef);
    const cur = fresh.data() || fallbackData;
    if (cur.status === 'PAID' && verifyPaymentProof(cur)) {
      return cur;
    }

    const effectivePaidAt = paidAt || new Date().toISOString();
    const updates = {
      status: 'PAID',
      verifiedBy,
      payerAccountName: payerAccountName || cur.payerAccountName || null,
      ...(bakongData ? { bakongData } : {}),
      ...(luyrielData ? { luyrielData } : {}),
      paidAt: effectivePaidAt,
      verificationProof: signPaymentProof({
        ...cur,
        status: 'PAID',
        verifiedBy,
        paidAt: effectivePaidAt,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    };

    tx.set(paymentRef, updates, { merge: true });
    return { ...cur, ...updates };
  });
}

async function checkBakongTransactionByMd5(md5Hash, config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${config.apiUrl}/v1/check_transaction_by_md5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({ md5: md5Hash }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (res.status === 401) {
      throw new AppError('Bakong Open API token is invalid or expired. Please renew BAKONG_TOKEN.', 502, 'BAKONG_UNAUTHORIZED');
    }
    if (!res.ok) {
      throw new AppError(
        json?.responseMessage || `Bakong API returned HTTP ${res.status}`,
        502,
        'BAKONG_API_ERROR'
      );
    }
    return json;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      err?.name === 'AbortError'
        ? 'Bakong verification request timed out.'
        : `Unable to reach Bakong API: ${err?.message || 'Network error'}`,
      502,
      'BAKONG_UNREACHABLE'
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates an official EMVCo KHQR payload (via LuyRiel PayWay API or local Bakong generator) & PNG QR Data URL locked to server pricing.
 */
export async function initiateKhqrPayment(payload = {}, user = null) {
  const firestore = ensureDb();
  if (!user?.uid) {
    throw new AppError('Authentication token is required to initiate payment', 401, 'AUTH_REQUIRED');
  }

  const config = getBakongConfig();
  const luyrielConfig = getLuyrielConfig();
  const activeProvider = resolveKhqrProvider(luyrielConfig);
  const currency = payload.currency === 'KHR' ? 'KHR' : 'USD';

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new AppError(
      'Cart items are required to initiate a verified Bakong KHQR session',
      400,
      'ITEMS_REQUIRED'
    );
  }

  const promoCode = payload.promoCode || payload.appliedCoupon || null;
  const quote = await computeServerOrderQuote(firestore, payload.items, promoCode);
  if (quote.total <= 0) {
    throw new AppError(
      'Order total is $0.00 after promo discount; KHQR payment is not required',
      400,
      'ZERO_TOTAL_ORDER'
    );
  }
  const expectedTotalUsd = quote.total;
  const cartDigest = quote.cartDigest;
  const appliedPromoCode = quote.appliedCoupon;
  const normalizedAmount =
    currency === 'KHR' ? Math.max(1, Math.round(quote.total * 4100)) : quote.total;

  const transactionId = `KHQR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const billNumber = `TT${Date.now().toString().slice(-8)}`;
  const nowMs = Date.now();
  const expiresMs = nowMs + 10 * 60 * 1000;
  const nowIso = new Date(nowMs).toISOString();
  let expiresAt = new Date(expiresMs).toISOString();

  let khqrString;
  let md5Hash;
  let luyrielPaymentId = null;
  let accountLabel = config.accountId;

  if (activeProvider === 'luyriel') {
    const luyrielResult = await createLuyrielPayment({
      amount: normalizedAmount,
      currency,
      orderId: transactionId,
      description: `TechTonic Store Order ${billNumber}`,
    });
    khqrString = luyrielResult.khqrString;
    md5Hash = luyrielResult.md5Hash || null;
    luyrielPaymentId = luyrielResult.luyrielPaymentId;
    accountLabel = luyrielConfig.merchantLabel || 'ABA PayWay KHQR';

    const parsedExpiry = luyrielResult.expiresAt ? Date.parse(luyrielResult.expiresAt) : NaN;
    if (Number.isFinite(parsedExpiry) && parsedExpiry > Date.now() + 15000) {
      expiresAt = new Date(parsedExpiry).toISOString();
    }
  } else {
    const khqrCurrency = currency === 'KHR' ? khqrData.currency.khr : khqrData.currency.usd;
    const individualInfo = new IndividualInfo(
      config.accountId,
      config.merchantName,
      config.merchantCity,
      {
        currency: khqrCurrency,
        amount: normalizedAmount,
        billNumber,
        storeLabel: 'TechTonic Store',
        terminalLabel: 'TechTonic Store',
        purposeOfTransaction: 'TechTonic Store',
        expirationTimestamp: expiresMs,
      }
    );

    const generated = new BakongKHQR().generateIndividual(individualInfo);
    if (generated?.status?.code !== 0 || !generated?.data?.qr || !generated?.data?.md5) {
      throw new AppError(
        generated?.status?.message || 'Failed to generate official Bakong KHQR payload',
        500,
        'KHQR_GENERATION_FAILED'
      );
    }

    khqrString = generated.data.qr;
    md5Hash = generated.data.md5;
  }

  const qrDataUrl = await QRCode.toDataURL(khqrString, {
    width: 360,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const isLuyriel = activeProvider === 'luyriel';
  const record = {
    id: transactionId,
    transactionId,
    luyrielPaymentId,
    md5Hash,
    billNumber,
    bakongAccountId: accountLabel,
    merchantName: config.merchantName,
    orderId: null,
    userId: user.uid,
    provider: isLuyriel ? 'LuyRiel ABA KHQR' : 'Bakong KHQR',
    paymentMethod: isLuyriel ? 'ABA PayWay KHQR (LuyRiel)' : 'Bakong KHQR (ABA / Wing / ACLEDA)',
    currency,
    amount: normalizedAmount,
    expectedTotalUsd,
    cartDigest,
    promoCode: appliedPromoCode,
    khqrString,
    status: 'PENDING',
    mode: isLuyriel ? 'luyriel' : config.token ? 'bakong_live' : 'telegram_verified',
    createdAt: nowIso,
    expiresAt,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection('payments').doc(transactionId).set(record);

  const liveVerificationEnabled = isLuyriel || Boolean(config.token);
  const telegramReady = !liveVerificationEnabled && (await isOrderTelegramReady());

  return {
    transactionId,
    luyrielPaymentId,
    md5Hash,
    billNumber,
    khqrString,
    qrDataUrl,
    bakongAccountId: accountLabel,
    merchantName: config.merchantName,
    amount: record.amount,
    expectedTotalUsd,
    currency,
    status: 'PENDING',
    expiresAt,
    provider: isLuyriel ? 'luyriel' : 'bakong',
    liveVerificationEnabled,
    telegramVerificationEnabled: telegramReady,
  };
}

/**
 * Verifies a KHQR payment strictly via LuyRiel PayWay API/Webhook, NBC Bakong API, or signed Telegram Admin confirmation (fail-closed).
 */
export async function verifyKhqrPayment(payload = {}, user = null, req = null) {
  const firestore = ensureDb();
  if (!user?.uid) {
    throw new AppError('Authentication token is required to verify payment', 401, 'AUTH_REQUIRED');
  }

  const config = getBakongConfig();
  const { transactionId, md5Hash, mode = 'manual' } = payload;

  if (!transactionId && !md5Hash) {
    throw new AppError('transactionId or md5Hash is required', 400, 'VALIDATION_ERROR');
  }

  let paymentSnap = null;
  if (transactionId) {
    paymentSnap = await firestore.collection('payments').doc(String(transactionId).trim()).get();
  } else if (md5Hash) {
    const query = await firestore
      .collection('payments')
      .where('md5Hash', '==', String(md5Hash).trim())
      .limit(1)
      .get();
    if (!query.empty) {
      paymentSnap = query.docs[0];
    }
  }

  if (!paymentSnap || !paymentSnap.exists) {
    throw new AppError('KHQR payment session not found', 404, 'PAYMENT_NOT_FOUND');
  }

  const paymentData = paymentSnap.data();

  if ((!paymentData.userId || paymentData.userId !== user.uid) && user.role !== 'admin') {
    await reportPaymentSecurityIncident(req || user, {
      reason: 'PAYMENT_OWNERSHIP_MISMATCH',
      transactionId: paymentData.transactionId,
      details: `User ${user.uid} tried verifying payment owned by ${paymentData.userId}`,
    });
    throw new AppError('You do not have permission to verify this payment session', 403, 'FORBIDDEN');
  }

  const formatPaidReceipt = (data) => ({
    success: true,
    status: 'PAID',
    verifiedBy: data.verifiedBy,
    verifiedByTelegramUser: data.verifiedByTelegramUser || null,
    payerAccountName: data.payerAccountName || payload.payerAccountName || null,
    provider: data.mode === 'luyriel' ? 'luyriel' : 'bakong',
    liveVerificationEnabled: data.mode === 'luyriel' || Boolean(config.token),
    telegramVerificationEnabled: data.verifiedBy === 'telegram_admin',
    transactionId: data.transactionId,
    luyrielPaymentId: data.luyrielPaymentId || null,
    md5Hash: data.md5Hash,
    paymentMethod: data.paymentMethod,
    amount: data.amount,
    expectedTotalUsd: data.expectedTotalUsd ?? data.amount,
    currency: data.currency,
    paidAt: data.paidAt || new Date().toISOString(),
  });

  if (paymentData.status === 'PAID') {
    if (!ALLOWED_VERIFIERS.includes(paymentData.verifiedBy) || !verifyPaymentProof(paymentData)) {
      await reportPaymentSecurityIncident(req || user, {
        reason: 'FORGED_PAYMENT_PROOF',
        transactionId: paymentData.transactionId,
        details: `Detected tampered PAID payment state on ${paymentData.transactionId} (verifiedBy=${paymentData.verifiedBy})`,
      });
      throw new AppError('Payment record failed security integrity check', 403, 'PAYMENT_PROOF_INVALID');
    }
    return formatPaidReceipt(paymentData);
  }

  if (paymentData.expiresAt && Date.now() > Date.parse(paymentData.expiresAt)) {
    await paymentSnap.ref.set(
      { status: 'EXPIRED', updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    throw new AppError('This KHQR code has expired. Please generate a new QR code.', 400, 'PAYMENT_EXPIRED');
  }

  if (paymentData.mode === 'luyriel' && paymentData.luyrielPaymentId) {
    const remote = await getLuyrielPaymentStatus(paymentData.luyrielPaymentId);
    if (remote.status === 'PAID' || remote.status === 'SUCCEEDED' || remote.status === 'COMPLETED') {
      const checked = await validateAmountAndCurrencyMatch(
        paymentData,
        remote.amount ?? paymentData.amount,
        remote.currency || paymentData.currency,
        { req, user, providerLabel: 'LuyRiel' }
      );

      const luyrielData = {
        paymentId: remote.id,
        hash: remote.hash || null,
        paidAmount: checked.paidAmount,
        currency: checked.currency,
        paidAt: remote.paidAt || null,
      };

      const verifiedRecord = await finalizePaidSession(firestore, paymentSnap.ref, paymentData, {
        verifiedBy: 'luyriel_api',
        paidAt: remote.paidAt || new Date().toISOString(),
        luyrielData,
      });

      return {
        ...formatPaidReceipt(verifiedRecord),
        luyrielData,
      };
    }

    if (remote.status === 'EXPIRED' || remote.status === 'CANCELLED' || remote.status === 'FAILED') {
      await paymentSnap.ref.set(
        { status: 'EXPIRED', updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      throw new AppError('This KHQR payment has expired. Please generate a new QR code.', 400, 'PAYMENT_EXPIRED');
    }

    if (mode === 'poll') {
      return {
        success: false,
        status: 'PENDING',
        provider: 'luyriel',
        liveVerificationEnabled: true,
        transactionId: paymentData.transactionId,
        md5Hash: paymentData.md5Hash,
        message: 'Waiting for ABA PayWay KHQR confirmation via LuyRiel.',
      };
    }

    throw new AppError(
      'Payment has not been confirmed yet. Please scan and complete payment in your banking app first.',
      402,
      'PAYMENT_PENDING'
    );
  }

  if (config.token) {
    const apiResult = await checkBakongTransactionByMd5(paymentData.md5Hash, config);
    if (apiResult?.responseCode === 0 && apiResult?.data) {
      const checked = await validateAmountAndCurrencyMatch(
        paymentData,
        apiResult.data.amount,
        apiResult.data.currency || paymentData.currency,
        { req, user, providerLabel: 'Bakong' }
      );

      if (
        apiResult.data.toAccountId &&
        String(apiResult.data.toAccountId).trim().toLowerCase() !== config.accountId.toLowerCase()
      ) {
        await reportPaymentSecurityIncident(req || user, {
          reason: 'PAYMENT_RECIPIENT_MISMATCH',
          transactionId: paymentData.transactionId,
          details: `Bakong destination ${apiResult.data.toAccountId} does not match ${config.accountId}`,
        });
        throw new AppError('Payment destination account mismatch.', 403, 'PAYMENT_RECIPIENT_MISMATCH');
      }

      const autoDetectedPayer = String(
        apiResult.data.fromAccountName ||
          apiResult.data.senderName ||
          apiResult.data.payerName ||
          apiResult.data.accountName ||
          apiResult.data.fromAccountId ||
          ''
      )
        .trim()
        .slice(0, 80);

      const bakongData = {
        hash: apiResult.data.hash || null,
        fromAccountId: apiResult.data.fromAccountId || null,
        fromAccountName: autoDetectedPayer || null,
        toAccountId: apiResult.data.toAccountId || null,
        externalRef: apiResult.data.externalRef || null,
        paidAmount: checked.paidAmount,
        currency: checked.currency,
      };
      const verifiedRecord = await finalizePaidSession(firestore, paymentSnap.ref, paymentData, {
        verifiedBy: 'bakong_api',
        paidAt: new Date().toISOString(),
        payerAccountName: autoDetectedPayer || null,
        bakongData,
      });

      return {
        ...formatPaidReceipt(verifiedRecord),
        bakongData,
      };
    }

    if (mode === 'poll') {
      return {
        success: false,
        status: 'PENDING',
        liveVerificationEnabled: true,
        transactionId: paymentData.transactionId,
        md5Hash: paymentData.md5Hash,
        message: 'Waiting for Bakong payment confirmation.',
      };
    }
    throw new AppError(
      'Bakong payment has not been received yet. Please scan and complete payment in your banking app first.',
      402,
      'PAYMENT_PENDING'
    );
  }

  const telegramReady = await isOrderTelegramReady();
  if (telegramReady) {
    if (mode === 'poll') {
      await pollOrderPaymentCallbacks();
      const refreshedSnap = await paymentSnap.ref.get();
      const latestData = refreshedSnap.exists ? refreshedSnap.data() : paymentData;
      if (latestData.status === 'PAID') {
        if (!verifyPaymentProof(latestData)) {
          throw new AppError('Payment record failed security integrity check', 403, 'PAYMENT_PROOF_INVALID');
        }
        return formatPaidReceipt(latestData);
      }
      if (latestData.status === 'REJECTED') {
        return {
          success: false,
          status: 'REJECTED',
          liveVerificationEnabled: false,
          telegramVerificationEnabled: true,
          transactionId: latestData.transactionId,
          md5Hash: latestData.md5Hash,
          message: 'Payment was marked as not received. Please verify your transfer and try again.',
        };
      }
      if (latestData.status === 'EXPIRED') {
        return {
          success: false,
          status: 'EXPIRED',
          liveVerificationEnabled: false,
          telegramVerificationEnabled: true,
          transactionId: latestData.transactionId,
          md5Hash: latestData.md5Hash,
          message: 'QR session expired. Please generate a new KHQR.',
        };
      }
      return {
        success: false,
        status: latestData.status || 'PENDING',
        liveVerificationEnabled: false,
        telegramVerificationEnabled: true,
        transactionId: latestData.transactionId,
        md5Hash: latestData.md5Hash,
        message: 'Waiting for shop owner confirmation on Telegram.',
      };
    }

    const lastPromptMs = paymentData.telegramRequestedAt
      ? Date.parse(paymentData.telegramRequestedAt)
      : 0;
    const withinCooldown =
      paymentData.status === 'AWAITING_ADMIN' && lastPromptMs && Date.now() - lastPromptMs < 12000;

    await paymentSnap.ref.set(
      {
        status: 'AWAITING_ADMIN',
        customerName: payload.customerName || paymentData.customerName || 'Customer',
        customerPhone: payload.customerPhone || paymentData.customerPhone || '-',
        ...(withinCooldown ? {} : { telegramRequestedAt: new Date().toISOString() }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (!withinCooldown) {
      await sendOrderPaymentVerificationPrompt({
        transactionId: paymentData.transactionId,
        billNumber: paymentData.billNumber || null,
        amount: paymentData.amount,
        currency: paymentData.currency,
        bakongAccountId: paymentData.bakongAccountId,
        customerName: payload.customerName || paymentData.customerName || 'Customer',
        customerPhone: payload.customerPhone || paymentData.customerPhone || '-',
      });
    }

    return {
      success: false,
      status: 'AWAITING_ADMIN',
      liveVerificationEnabled: false,
      telegramVerificationEnabled: true,
      transactionId: paymentData.transactionId,
      md5Hash: paymentData.md5Hash,
      message: 'Verification request sent to Telegram Order Bot.',
    };
  }

  // Fail closed: never allow unverified sandbox auto-confirmations
  await reportPaymentSecurityIncident(req || user, {
    reason: 'PAYMENT_VERIFIER_UNAVAILABLE',
    transactionId: paymentData.transactionId,
    severity: 'warning',
    details: 'KHQR verification requested while neither LuyRiel, Bakong API, nor Telegram verifier was ready (blocked fail-closed)',
  });
  throw new AppError(
    'Payment verification service is currently unavailable. Please contact support before retrying.',
    503,
    'PAYMENT_VERIFICATION_UNAVAILABLE'
  );
}

/**
 * Verifies signed HMAC-SHA512 webhook events from LuyRiel and atomically marks matching KHQR sessions as PAID.
 */
export async function processLuyrielWebhook(req) {
  const firestore = ensureDb();
  const { webhookSecret } = getLuyrielConfig();
  const signature = req.headers?.['x-signature'] || '';
  const rawPayload = req.rawBody ?? JSON.stringify(req.body || {});

  if (!verifyLuyrielWebhookSignature(rawPayload, signature, webhookSecret)) {
    await reportPaymentSecurityIncident(req, {
      reason: 'LUYRIEL_WEBHOOK_SPOOF_BLOCKED',
      severity: 'critical',
      details: 'Rejected unverified POST to /payments/khqr/luyriel-webhook (invalid or missing X-Signature)',
    });
    return { verified: false };
  }

  const payload = req.body && typeof req.body === 'object' ? req.body : {};
  const eventName = String(payload.event || '').trim().toLowerCase();
  const eventData = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const remoteStatus = String(eventData.status || '').trim().toUpperCase();

  if (eventName === 'webhook.test' || eventName === 'test') {
    return { verified: true, handled: true, test: true };
  }

  const isPaidEvent =
    eventName === 'payment.paid' ||
    eventName === 'payment.succeeded' ||
    remoteStatus === 'PAID' ||
    remoteStatus === 'SUCCEEDED' ||
    remoteStatus === 'COMPLETED';

  if (!isPaidEvent) {
    return { verified: true, handled: false, reason: 'NON_PAID_EVENT' };
  }

  const luyrielId = String(eventData.id || eventData.payment_id || '').trim();
  const orderRefId = String(eventData.order_id || '').trim();

  let paymentSnap = null;
  if (orderRefId.startsWith('KHQR-')) {
    const candidate = await firestore.collection('payments').doc(orderRefId).get();
    if (candidate.exists) {
      paymentSnap = candidate;
    }
  }
  if (!paymentSnap && luyrielId) {
    const query = await firestore
      .collection('payments')
      .where('luyrielPaymentId', '==', luyrielId)
      .limit(1)
      .get();
    if (!query.empty) {
      paymentSnap = query.docs[0];
    }
  }

  if (!paymentSnap || !paymentSnap.exists) {
    return { verified: true, handled: false, reason: 'PAYMENT_SESSION_NOT_FOUND' };
  }

  const paymentData = paymentSnap.data() || {};
  if (paymentData.status === 'PAID' && verifyPaymentProof(paymentData)) {
    return { verified: true, handled: true, alreadyPaid: true, transactionId: paymentData.transactionId };
  }

  const checked = await validateAmountAndCurrencyMatch(
    paymentData,
    eventData.amount ?? paymentData.amount,
    eventData.currency || paymentData.currency,
    { req, providerLabel: 'LuyRiel Webhook' }
  );

  const luyrielData = {
    paymentId: luyrielId || paymentData.luyrielPaymentId || null,
    hash: eventData.hash || null,
    paidAmount: checked.paidAmount,
    currency: checked.currency,
    event: eventName || 'payment.paid',
  };

  await finalizePaidSession(firestore, paymentSnap.ref, paymentData, {
    verifiedBy: 'luyriel_webhook',
    paidAt: eventData.paid_at || payload.created_at || new Date().toISOString(),
    luyrielData,
  });

  await recordAuditEvent(req, {
    eventType: 'PAYMENT_KHQR_WEBHOOK_PAID',
    severity: 'info',
    targetType: 'payment',
    targetId: paymentData.transactionId,
    status: 'SUCCESS',
    details: `LuyRiel webhook confirmed ${checked.paidAmount} ${checked.currency} (${luyrielData.paymentId || 'webhook'})`,
  });

  return { verified: true, handled: true, transactionId: paymentData.transactionId };
}

/**
 * Disabled endpoint: store enforces verified Bakong KHQR payments only.
 */
export async function processCardPayment(_payload = {}, user = null, req = null) {
  await reportPaymentSecurityIncident(req || user, {
    reason: 'CARD_ENDPOINT_PROBE',
    severity: 'critical',
    details: 'Blocked attempt to call disabled /payments/card gateway',
  });
  throw new AppError(
    'Card payment gateway is disabled. Only verified Bakong KHQR payments are accepted.',
    403,
    'CARD_PAYMENT_DISABLED'
  );
}

