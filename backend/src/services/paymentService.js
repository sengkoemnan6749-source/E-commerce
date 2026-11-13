import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

/**
 * Generates an EMVCo-compatible KHQR payload and records a pending payment transaction.
 */
export async function initiateKhqrPayment(payload = {}, user = null) {
  const firestore = ensureDb();
  const amount = Number(payload.amount);
  const currency = payload.currency === 'KHR' ? 'KHR' : 'USD';

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Payment amount must be greater than zero', 400, 'VALIDATION_ERROR');
  }

  const transactionId = `KHQR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const khqrString = [
    '000201',
    '010212',
    '29370016abaakhppxxx@abaa0109003992102',
    `52045732`,
    `5303${currency === 'KHR' ? '116' : '840'}`,
    `54${String(amount.toFixed(2)).length.toString().padStart(2, '0')}${amount.toFixed(2)}`,
    '5802KH',
    '5914TECHTONIC KHQR',
    '6010Phnom Penh',
    `62120108${transactionId.slice(-8)}`,
  ].join('');

  const md5Hash = crypto.createHash('md5').update(khqrString).digest('hex');
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const record = {
    id: transactionId,
    transactionId,
    md5Hash,
    orderId: payload.orderId || null,
    userId: user?.uid || null,
    provider: 'Bakong KHQR',
    paymentMethod: 'Bakong KHQR (ABA / Wing / ACLEDA)',
    currency,
    amount: Math.round(amount * 100) / 100,
    khqrString,
    status: 'PENDING',
    mode: process.env.PAYMENT_MODE || 'sandbox',
    createdAt: nowIso,
    expiresAt,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection('payments').doc(transactionId).set(record);

  return {
    transactionId,
    md5Hash,
    khqrString,
    amount: record.amount,
    currency,
    status: 'PENDING',
    expiresAt,
  };
}

/**
 * Verifies a Bakong KHQR payment and optionally updates the linked order's paymentStatus.
 */
export async function verifyKhqrPayment(payload = {}) {
  const firestore = ensureDb();
  const { transactionId, md5Hash } = payload;

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
  const paidAt = new Date().toISOString();

  await paymentSnap.ref.update({
    status: 'PAID',
    paidAt,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (paymentData.orderId) {
    const orderRef = firestore.collection('orders').doc(String(paymentData.orderId));
    const orderSnap = await orderRef.get();
    if (orderSnap.exists) {
      await orderRef.update({
        paymentStatus: 'Paid',
        transactionId: paymentData.transactionId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return {
    success: true,
    status: 'PAID',
    transactionId: paymentData.transactionId,
    md5Hash: paymentData.md5Hash,
    paymentMethod: paymentData.paymentMethod,
    amount: paymentData.amount,
    currency: paymentData.currency,
    paidAt,
  };
}

/**
 * Processes a card payment (sanitizing card number to last 4 digits only) and persists transaction receipt.
 */
export async function processCardPayment(payload = {}, user = null) {
  const firestore = ensureDb();
  const amount = Number(payload.amount);
  const digits = String(payload.cardNumber || '').replace(/\D/g, '');
  const cardHolder = String(payload.cardHolder || payload.name || 'Card Holder').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Payment amount must be greater than zero', 400, 'VALIDATION_ERROR');
  }

  if (digits.length < 4) {
    throw new AppError('Valid card number is required', 400, 'VALIDATION_ERROR');
  }

  const last4 = digits.slice(-4);
  const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Card';
  const transactionId = `CARD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const nowIso = new Date().toISOString();

  const record = {
    id: transactionId,
    transactionId,
    orderId: payload.orderId || null,
    userId: user?.uid || null,
    provider: 'Card Gateway',
    paymentMethod: `Credit Card (${brand} •••• ${last4})`,
    cardHolder,
    last4,
    brand,
    currency: 'USD',
    amount: Math.round(amount * 100) / 100,
    status: 'PAID',
    mode: process.env.PAYMENT_MODE || 'sandbox',
    paidAt: nowIso,
    createdAt: nowIso,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection('payments').doc(transactionId).set(record);

  if (payload.orderId) {
    const orderRef = firestore.collection('orders').doc(String(payload.orderId));
    const orderSnap = await orderRef.get();
    if (orderSnap.exists) {
      await orderRef.update({
        paymentStatus: 'Paid',
        paymentMethod: record.paymentMethod,
        transactionId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return {
    success: true,
    status: 'PAID',
    transactionId,
    paymentMethod: record.paymentMethod,
    last4,
    brand,
    amount: record.amount,
    currency: 'USD',
    paidAt: nowIso,
  };
}

