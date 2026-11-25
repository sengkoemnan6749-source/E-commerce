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
  isOrderTelegramReady,
  pollOrderPaymentCallbacks,
  sendOrderPaymentVerificationPrompt,
} from './telegramService.js';

const ALLOWED_VERIFIERS = ['bakong_api', 'telegram_admin'];

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function getBakongConfig() {
  const rawGateway = String(process.env.BAKONG_GATEWAY_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const gatewayUrl =
    !rawGateway || rawGateway.includes('lorndavid.online')
      ? 'https://khqr-aba-autoverify.vercel.app'
      : rawGateway;

  return {
    accountId: String(process.env.BAKONG_ACCOUNT_ID || 'seng_koemnan@bkrt').trim(),
    merchantName: 'TechTonic Store',
    merchantCity: String(process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh').trim().slice(0, 15),
    apiUrl: String(process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh').replace(/\/+$/, ''),
    gatewayUrl,
    token: String(process.env.BAKONG_TOKEN || '').trim(),
  };
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
  { verifiedBy, paidAt, payerAccountName = null, bakongData = null }
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

async function trySettleFromBakongApiResult(
  firestore,
  paymentRef,
  paymentData,
  apiResult,
  config,
  { req = null, user = null, providerLabel = 'Bakong' } = {}
) {
  if (apiResult?.responseCode !== 0 || !apiResult?.data) {
    return null;
  }

  const checked = await validateAmountAndCurrencyMatch(
    paymentData,
    apiResult.data.amount,
    apiResult.data.currency || paymentData.currency,
    { req, user, providerLabel }
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

  const verifiedRecord = await finalizePaidSession(firestore, paymentRef, paymentData, {
    verifiedBy: 'bakong_api',
    paidAt: new Date().toISOString(),
    payerAccountName: autoDetectedPayer || null,
    bakongData,
  });

  return { settled: true, verifiedRecord, bakongData };
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

function parseBakongPortalNuxtData(rawJson) {
  try {
    const arr = JSON.parse(rawJson);
    function resolve(idx, depth = 0) {
      if (depth > 12 || typeof idx !== 'number' || idx < 0 || idx >= arr.length) return idx;
      const val = arr[idx];
      if (Array.isArray(val)) {
        if (val[0] === 'ShallowReactive' || val[0] === 'Reactive' || val[0] === 'Ref') {
          return resolve(val[1], depth + 1);
        }
        return val.map((v) => resolve(v, depth + 1));
      }
      if (val && typeof val === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(val)) {
          out[k] = resolve(v, depth + 1);
        }
        return out;
      }
      return val;
    }
    const root = resolve(0);
    return root?.data?.['tx-lookup'] || null;
  } catch {
    return null;
  }
}

async function queryBakongGatewayTokenless(md5Hash) {
  const cookieVal = encodeURIComponent(
    JSON.stringify({
      type: 'MD5',
      value: md5Hash,
      amount: '',
      ccy: 'USD',
    })
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch('https://api-bakong.nbc.gov.kh/', {
      method: 'GET',
      headers: {
        Cookie: `tx_search=${cookieVal}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'km-KH,km;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: 'https://api-bakong.nbc.gov.kh/',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    const lookup = parseBakongPortalNuxtData(match[1]);
    if (lookup && lookup.txResult && lookup.txResult.hash) {
      return {
        responseCode: 0,
        responseMessage: 'Success (Tokenless Bakong Official Gateway)',
        data: lookup.txResult,
      };
    }
    return {
      responseCode: 1,
      errorCode: lookup?.txError?.errorCode || 1,
      responseMessage: 'Transaction not found yet',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function generateBakongViaGateway(config, { amount, currency, billNumber }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(`${config.gatewayUrl}/api/generate-khqr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        bakongAccountId: config.accountId,
        merchantName: config.merchantName,
        merchantCity: config.merchantCity,
        amount: Number(amount),
        currency,
        billNumber,
        storeLabel: 'TechTonic Store',
      }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    const d = json?.data || json || {};
    const khqrString = String(d?.qr || d?.qrString || '').trim();
    const md5Hash = String(d?.md5 || '').trim().toLowerCase();
    if (!res.ok || !khqrString || !/^[a-f0-9]{32}$/i.test(md5Hash)) {
      throw new AppError(
        json?.error || json?.message || `Bakong gateway generate returned HTTP ${res.status}`,
        502,
        'BAKONG_GATEWAY_UNAVAILABLE'
      );
    }
    return {
      khqrString,
      md5Hash,
      qrDataUrl: String(d?.qrDataUrl || '').trim() || null,
      txToken: String(d?.txToken || '').trim() || null,
      deeplink: d?.deeplink || d?.mobilePayUrl || null,
      expirationTimestamp: Number(d?.expiresAt || d?.expirationTimestamp) || null,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      err?.name === 'AbortError'
        ? 'Bakong gateway QR generation timed out.'
        : `Unable to reach Bakong gateway: ${err?.message || 'Network error'}`,
      502,
      'BAKONG_UNREACHABLE'
    );
  } finally {
    clearTimeout(timer);
  }
}

async function checkBakongViaGateway(md5Hash, gatewayUrl, txToken = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${gatewayUrl}/api/check-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        md5: md5Hash,
        ...(txToken ? { txToken } : {}),
      }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);

    if (res.ok && json && typeof json === 'object') {
      if (json.status === 'PAID' || json?.bakongApiFeedback?.responseCode === 0) {
        const txDetails =
          json?.bakongApiFeedback?.data ||
          json?.transaction?.paymentDetails ||
          json?.transaction ||
          {};
        return {
          responseCode: 0,
          source: json.source || txDetails.source || 'BAKONG_OFFICIAL_GATEWAY_ZERO_TOKEN',
          data: {
            hash: txDetails.hash || md5Hash,
            fromAccountId: txDetails.fromAccountId || txDetails.payerAccount || null,
            fromAccountName:
              txDetails.fromAccountName ||
              txDetails.payerName ||
              txDetails.fromAccountId ||
              null,
            toAccountId: txDetails.toAccountId || json?.transaction?.bakongAccountId || null,
            amount: txDetails.amount ?? json?.transaction?.amount,
            currency: txDetails.currency || json?.transaction?.currency,
            externalRef: txDetails.externalRef || json?.transaction?.billNumber || null,
          },
        };
      }
      if (typeof json.responseCode === 'number') {
        return json;
      }
      if (json.cloudflareBlocked) {
        const directTokenless = await queryBakongGatewayTokenless(md5Hash);
        if (directTokenless) return directTokenless;
      }
      return (
        json.bakongApiFeedback || {
          responseCode: 1,
          errorCode: 1,
          responseMessage: 'Transaction not found yet',
        }
      );
    }

    const directFallback = await queryBakongGatewayTokenless(md5Hash);
    if (directFallback) {
      return directFallback;
    }

    throw new AppError(
      `Bakong gateway returned HTTP ${res.status}`,
      502,
      'BAKONG_GATEWAY_UNAVAILABLE'
    );
  } catch (err) {
    const directFallback = await queryBakongGatewayTokenless(md5Hash);
    if (directFallback) {
      return directFallback;
    }
    if (err instanceof AppError) throw err;
    throw new AppError(
      err?.name === 'AbortError'
        ? 'Bakong gateway verification timed out.'
        : `Unable to reach Bakong gateway: ${err?.message || 'Network error'}`,
      502,
      'BAKONG_UNREACHABLE'
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates an official EMVCo Bakong KHQR payload & PNG QR Data URL locked to server pricing.
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
  const billNumber = `ORDER-${Date.now().toString().slice(-6)}`;
  const nowMs = Date.now();
  const expiresMs = nowMs + 5 * 60 * 1000;
  const nowIso = new Date(nowMs).toISOString();
  let expiresAt = new Date(expiresMs).toISOString();

  let khqrString;
  let md5Hash;
  let txToken = null;
  let gatewayQrDataUrl = null;
  let deeplink = null;
  let generatedViaGateway = false;

  if (!config.token && config.gatewayUrl) {
    try {
      const gwResult = await generateBakongViaGateway(config, {
        amount: normalizedAmount,
        currency,
        billNumber,
      });
      khqrString = gwResult.khqrString;
      md5Hash = gwResult.md5Hash;
      txToken = gwResult.txToken || null;
      gatewayQrDataUrl = gwResult.qrDataUrl || null;
      deeplink = gwResult.deeplink || null;
      if (gwResult.expirationTimestamp && gwResult.expirationTimestamp > Date.now() + 15000) {
        expiresAt = new Date(gwResult.expirationTimestamp).toISOString();
      }
      generatedViaGateway = true;
    } catch (err) {
      console.warn('[Bakong Gateway Generate Fallback]', err?.message || 'Using local BakongKHQR generator');
    }
  }

  if (!generatedViaGateway) {
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

  const qrDataUrl =
    gatewayQrDataUrl ||
    (await QRCode.toDataURL(khqrString, {
      width: 360,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }));

  const hasBakongAutoVerify = Boolean(config.token || config.gatewayUrl || generatedViaGateway);
  const liveVerificationEnabled = hasBakongAutoVerify;
  const fastPolling = true;
  const record = {
    id: transactionId,
    transactionId,
    md5Hash,
    txToken,
    billNumber,
    deeplink: deeplink || null,
    bakongAccountId: config.accountId,
    merchantName: config.merchantName,
    orderId: null,
    userId: user.uid,
    provider: 'Bakong KHQR',
    paymentMethod: 'Bakong KHQR',
    currency,
    amount: normalizedAmount,
    expectedTotalUsd,
    cartDigest,
    promoCode: appliedPromoCode,
    khqrString,
    status: 'PENDING',
    mode: config.token
      ? 'bakong_live'
      : generatedViaGateway || config.gatewayUrl
      ? 'bakong_gateway'
      : 'telegram_verified',
    createdAt: nowIso,
    expiresAt,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection('payments').doc(transactionId).set(record);

  const telegramReady = await isOrderTelegramReady();

  return {
    transactionId,
    md5: md5Hash,
    md5Hash,
    txToken,
    billNumber,
    qr: khqrString,
    khqrString,
    qrDataUrl,
    deeplink: deeplink || null,
    bakongAccountId: config.accountId,
    merchantName: config.merchantName,
    amount: record.amount,
    expectedTotalUsd,
    currency,
    status: 'PENDING',
    expiresAt,
    provider: 'bakong',
    fastPolling,
    liveVerificationEnabled,
    telegramVerificationEnabled: telegramReady,
  };
}

/**
 * Verifies a Bakong KHQR payment strictly via NBC Bakong API / Bakong gateway or signed Telegram Admin confirmation (fail-closed).
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
    provider: 'bakong',
    liveVerificationEnabled: data.mode === 'bakong_gateway' || Boolean(config.token),
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

  const shouldSkipPollGateway =
    mode === 'poll' && paymentData.mode === 'telegram_verified' && !config.token;

  if (!shouldSkipPollGateway && (config.token || config.gatewayUrl)) {
    let gatewayFallbackTriggered = false;
    try {
      const effectiveTxToken = payload.txToken || paymentData.txToken || null;
      const effectiveMd5 = String(payload.md5 || payload.md5Hash || paymentData.md5Hash || '').trim();
      const apiResult = config.token
        ? await checkBakongTransactionByMd5(effectiveMd5, config)
        : await checkBakongViaGateway(effectiveMd5, config.gatewayUrl, effectiveTxToken);

      const settled = await trySettleFromBakongApiResult(
        firestore,
        paymentSnap.ref,
        paymentData,
        apiResult,
        config,
        { req, user, providerLabel: 'Bakong' }
      );
      if (settled) {
        return {
          ...formatPaidReceipt(settled.verifiedRecord),
          source: apiResult?.source || 'BAKONG_OFFICIAL_GATEWAY_ZERO_TOKEN',
          bakongData: settled.bakongData,
        };
      }

      if (mode === 'telegram_request' && (await isOrderTelegramReady())) {
        gatewayFallbackTriggered = true;
      } else if (mode === 'poll') {
        return {
          success: false,
          status: 'PENDING',
          provider: 'bakong',
          liveVerificationEnabled: true,
          transactionId: paymentData.transactionId,
          md5Hash: paymentData.md5Hash,
          message: 'Waiting for Bakong payment confirmation.',
        };
      } else {
        throw new AppError(
          'Bakong payment has not been received yet. Please scan and complete payment in your banking app first.',
          402,
          'PAYMENT_PENDING'
        );
      }
    } catch (err) {
      const recoverable =
        !config.token &&
        (err?.code === 'BAKONG_GATEWAY_UNAVAILABLE' || err?.code === 'BAKONG_UNREACHABLE') &&
        (await isOrderTelegramReady());
      if (!recoverable) {
        throw err;
      }
      console.warn('[Bakong Gateway Verify Fallback]', err?.message || 'Falling back to Telegram verification');
      gatewayFallbackTriggered = true;
    }

    if (!gatewayFallbackTriggered) {
      throw new AppError(
        'Bakong payment has not been received yet. Please scan and complete payment in your banking app first.',
        402,
        'PAYMENT_PENDING'
      );
    }
  }

  const telegramReady = await isOrderTelegramReady();
  if (telegramReady) {
    if (mode === 'poll') {
      if (paymentData.status !== 'AWAITING_ADMIN') {
        return {
          success: false,
          status: 'PENDING',
          provider: 'bakong',
          liveVerificationEnabled: false,
          telegramVerificationEnabled: true,
          transactionId: paymentData.transactionId,
          md5Hash: paymentData.md5Hash,
          message: 'Waiting for Bakong payment confirmation.',
        };
      }
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

let watcherStop = null;

/**
 * Watches Firestore KHQR sessions via real-time onSnapshot and settles payments from a Cambodia-reachable IP.
 */
export function startBakongSettlementWatcher({
  intervalMs = 1200,
  onSessionsUpdate = null,
  onSettled = null,
  onError = null,
} = {}) {
  if (watcherStop) return watcherStop;

  const firestore = ensureDb();
  const config = getBakongConfig();
  if (!config.gatewayUrl && !config.token) {
    return () => {};
  }

  const activeSessions = new Map();
  const inFlightIds = new Set();

  const emitSessions = () => {
    if (typeof onSessionsUpdate !== 'function') return;
    onSessionsUpdate(
      Array.from(activeSessions.values()).map((e) => ({
        transactionId: e.id,
        billNumber: e.data?.billNumber || null,
        amount: e.data?.amount,
        currency: e.data?.currency,
        status: e.data?.status,
        createdAt: e.data?.createdAt,
        expiresAt: e.data?.expiresAt,
      }))
    );
  };

  const checkEntry = async (id, entry) => {
    if (inFlightIds.has(id)) return;
    const data = entry.data || {};

    if (data.expiresAt && Date.now() > Date.parse(data.expiresAt) + 2 * 60 * 1000) {
      await entry.ref
        .set({ status: 'EXPIRED', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
        .catch(() => {});
      activeSessions.delete(id);
      emitSessions();
      return;
    }

    if (!data.md5Hash) return;

    inFlightIds.add(id);
    try {
      let apiResult = null;
      if (config.token) {
        apiResult = await checkBakongTransactionByMd5(data.md5Hash, config);
      } else {
        try {
          apiResult = await checkBakongViaGateway(
            data.md5Hash,
            config.gatewayUrl,
            data.txToken || null
          );
        } catch (gwErr) {
          if (config.token) {
            apiResult = await checkBakongTransactionByMd5(data.md5Hash, config);
          } else {
            throw gwErr;
          }
        }
      }

      const settled = await trySettleFromBakongApiResult(
        firestore,
        entry.ref,
        data,
        apiResult,
        config,
        { providerLabel: 'Bakong Auto-Verify' }
      );
      if (settled) {
        console.log(`[Bakong Auto-Verify] Settled ${id} (${data.amount} ${data.currency})`);
        activeSessions.delete(id);
        onSettled?.({
          transactionId: id,
          billNumber: data.billNumber || null,
          amount: data.amount,
          currency: data.currency,
          payer:
            settled.bakongData?.fromAccountName ||
            settled.bakongData?.fromAccountId ||
            null,
          externalRef: settled.bakongData?.externalRef || null,
          settledAt: new Date().toISOString(),
        });
        emitSessions();
      }
    } catch (err) {
      onError?.(err?.message || String(err));
      if (
        err?.code === 'PAYMENT_RECIPIENT_MISMATCH' ||
        err?.code === 'PAYMENT_AMOUNT_MISMATCH' ||
        err?.code === 'PAYMENT_CURRENCY_MISMATCH' ||
        err?.code === 'UNDERPAID'
      ) {
        console.warn(`[Bakong Auto-Verify] Security mismatch on ${id}: ${err.message}`);
        activeSessions.delete(id);
        emitSessions();
      }
    } finally {
      inFlightIds.delete(id);
    }
  };

  const tick = () => {
    if (activeSessions.size === 0) return;
    for (const [id, entry] of activeSessions.entries()) {
      void checkEntry(id, entry);
    }
  };

  const unsubscribe = firestore
    .collection('payments')
    .where('status', 'in', ['PENDING', 'AWAITING_ADMIN'])
    .onSnapshot(
      (snap) => {
        activeSessions.clear();
        const newestByUser = new Map();
        for (const doc of snap.docs) {
          const d = doc.data() || {};
          const uid = d.userId || doc.id;
          const prev = newestByUser.get(uid);
          if (!prev || String(d.createdAt || '') >= String(prev.data?.createdAt || '')) {
            if (prev && prev.data?.status === 'PENDING') {
              prev.ref
                .set({ status: 'EXPIRED', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
                .catch(() => {});
            }
            newestByUser.set(uid, { id: doc.id, ref: doc.ref, data: d });
          } else if (d.status === 'PENDING') {
            doc.ref
              .set({ status: 'EXPIRED', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
              .catch(() => {});
          }
        }
        for (const [ , entry] of newestByUser.entries()) {
          activeSessions.set(entry.id, entry);
        }
        emitSessions();
        const hasAdded = snap.docChanges().some((c) => c.type === 'added');
        if (hasAdded && activeSessions.size > 0) {
          setTimeout(tick, 400);
        }
      },
      (err) => {
        onError?.(err?.message || String(err));
        console.warn('[Bakong Watcher Snapshot Error]', err?.message || err);
      }
    );

  const timer = setInterval(tick, intervalMs);
  watcherStop = () => {
    clearInterval(timer);
    unsubscribe();
    watcherStop = null;
  };
  return watcherStop;
}

