import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { computeServerOrderQuote } from './orderService.js';
import {
  reportPaymentSecurityIncident,
  signPaymentProof,
  verifyPaymentProof,
} from './paymentSecurity.js';
import {
  isOrderTelegramReady,
  pollOrderPaymentCallbacks,
  sendOrderPaymentVerificationPrompt,
} from './telegramService.js';

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
 * Generates an official EMVCo Bakong KHQR payload & PNG QR Data URL locked to server-computed pricing and the authenticated buyer.
 */
export async function initiateKhqrPayment(payload = {}, user = null) {
  const firestore = ensureDb();
  if (!user?.uid) {
    throw new AppError('Authentication token is required to initiate payment', 401, 'AUTH_REQUIRED');
  }

  const config = getBakongConfig();
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
  const expiresAt = new Date(expiresMs).toISOString();

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

  const khqrString = generated.data.qr;
  const md5Hash = generated.data.md5;
  const qrDataUrl = await QRCode.toDataURL(khqrString, {
    width: 360,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const record = {
    id: transactionId,
    transactionId,
    md5Hash,
    billNumber,
    bakongAccountId: config.accountId,
    merchantName: config.merchantName,
    orderId: null,
    userId: user.uid,
    provider: 'Bakong KHQR',
    paymentMethod: 'Bakong KHQR (ABA / Wing / ACLEDA)',
    currency,
    amount: normalizedAmount,
    expectedTotalUsd,
    cartDigest,
    promoCode: appliedPromoCode,
    khqrString,
    status: 'PENDING',
    mode: config.token ? 'bakong_live' : 'telegram_verified',
    createdAt: nowIso,
    expiresAt,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection('payments').doc(transactionId).set(record);

  const telegramReady = !config.token && (await isOrderTelegramReady());

  return {
    transactionId,
    md5Hash,
    billNumber,
    khqrString,
    qrDataUrl,
    bakongAccountId: config.accountId,
    merchantName: config.merchantName,
    amount: record.amount,
    expectedTotalUsd,
    currency,
    status: 'PENDING',
    expiresAt,
    liveVerificationEnabled: Boolean(config.token),
    telegramVerificationEnabled: telegramReady,
  };
}

/**
 * Verifies a Bakong KHQR payment strictly via NBC Bakong Open API or signed Telegram 1-Tap Admin confirmation (fail-closed, zero sandbox bypass).
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
    liveVerificationEnabled: Boolean(config.token),
    telegramVerificationEnabled: data.verifiedBy === 'telegram_admin',
    transactionId: data.transactionId,
    md5Hash: data.md5Hash,
    paymentMethod: data.paymentMethod,
    amount: data.amount,
    expectedTotalUsd: data.expectedTotalUsd ?? data.amount,
    currency: data.currency,
    paidAt: data.paidAt || new Date().toISOString(),
  });

  if (paymentData.status === 'PAID') {
    const allowed = ['bakong_api', 'telegram_admin'];
    if (!allowed.includes(paymentData.verifiedBy) || !verifyPaymentProof(paymentData)) {
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

  if (config.token) {
    const apiResult = await checkBakongTransactionByMd5(paymentData.md5Hash, config);
    if (apiResult?.responseCode === 0 && apiResult?.data) {
      const remoteCurrency = String(apiResult.data.currency || paymentData.currency || 'USD').toUpperCase();
      if (remoteCurrency !== String(paymentData.currency || 'USD').toUpperCase()) {
        await reportPaymentSecurityIncident(req || user, {
          reason: 'PAYMENT_CURRENCY_MISMATCH',
          transactionId: paymentData.transactionId,
          details: `Bakong returned currency ${remoteCurrency}, expected ${paymentData.currency}`,
        });
        throw new AppError('Paid currency does not match KHQR currency.', 400, 'PAYMENT_CURRENCY_MISMATCH');
      }

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

      const paidAmount = Number(apiResult.data.amount || 0);
      const tolerance = paymentData.currency === 'USD' ? 0.005 : 1;
      if (paidAmount + tolerance < Number(paymentData.amount || 0)) {
        await reportPaymentSecurityIncident(req || user, {
          reason: 'PAYMENT_AMOUNT_MISMATCH',
          transactionId: paymentData.transactionId,
          details: `Bakong underpaid ${paidAmount} ${remoteCurrency} vs required ${paymentData.amount}`,
        });
        throw new AppError(
          `Paid amount (${paidAmount} ${remoteCurrency}) is less than required (${paymentData.amount} ${paymentData.currency}).`,
          400,
          'UNDERPAID'
        );
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
        paidAmount,
        currency: remoteCurrency,
      };
      const paidAt = new Date().toISOString();
      const verifiedRecord = await firestore.runTransaction(async (tx) => {
        const fresh = await tx.get(paymentSnap.ref);
        const cur = fresh.data() || paymentData;
        if (cur.status === 'PAID' && verifyPaymentProof(cur)) {
          return cur;
        }
        const updates = {
          status: 'PAID',
          verifiedBy: 'bakong_api',
          payerAccountName: autoDetectedPayer || cur.payerAccountName || null,
          bakongData,
          paidAt,
          verificationProof: signPaymentProof({
            ...cur,
            status: 'PAID',
            verifiedBy: 'bakong_api',
            paidAt,
          }),
          updatedAt: FieldValue.serverTimestamp(),
        };
        tx.set(paymentSnap.ref, updates, { merge: true });
        return { ...cur, ...updates };
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
    details: 'KHQR verification requested while neither Bakong API nor Telegram verifier was ready (blocked fail-closed)',
  });
  throw new AppError(
    'Payment verification service is currently unavailable. Please contact support before retrying.',
    503,
    'PAYMENT_VERIFICATION_UNAVAILABLE'
  );
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

