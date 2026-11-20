import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateDiscountForPromo } from './promoService.js';
import { sendOrderConfirmationEmail } from './emailService.js';
import {
  buildCartDigest,
  reportPaymentSecurityIncident,
  signOrderIntegrity,
  verifyPaymentProof,
} from './paymentSecurity.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function cleanOrderField(value, maxLen = 120) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Strips internal cryptographic signatures before returning orders to client callers.
 */
function toPublicOrder(order) {
  if (!order || typeof order !== 'object') return order;
  const { paymentVerification, ...rest } = order;
  return {
    ...rest,
    ...(paymentVerification
      ? {
          paymentVerification: {
            transactionId: paymentVerification.transactionId || order.transactionId || null,
            verifiedBy: paymentVerification.verifiedBy || null,
            paidAt: paymentVerification.paidAt || null,
          },
        }
      : {}),
  };
}

export function generateOrderId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

export function mapStatusToStepIndex(status = '') {
  const s = String(status).trim().toLowerCase();
  if (s === 'pending') return 0;
  if (s === 'confirmed') return 1;
  if (s === 'processing' || s === 'packing') return 2;
  if (s === 'out for delivery' || s === 'shipped') return 3;
  if (s === 'delivered') return 4;
  if (s === 'cancelled') return -1;
  return 1;
}

function resolveShippingAddress(payload) {
  const raw = payload.shippingAddress || payload.customer || {};
  const fullName = cleanOrderField(raw.fullName || payload.customerName, 80);
  const phone = cleanOrderField(raw.phone || payload.customerPhone, 32);
  const email = cleanOrderField(raw.email || payload.customerEmail, 120);
  const address = cleanOrderField(raw.address, 220);
  const city = cleanOrderField(raw.city, 80);
  const province = cleanOrderField(raw.province || 'Phnom Penh', 80);
  const postalCode = cleanOrderField(raw.postalCode || '12000', 20);

  if (!fullName || !phone || !address || !city) {
    throw new AppError(
      'Shipping address requires fullName, phone, address, and city',
      400,
      'VALIDATION_ERROR'
    );
  }

  return { fullName, phone, email, address, city, province, postalCode };
}

/**
 * Normalizes and validates cart items array before pricing or order placement.
 */
export function normalizeOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError('Order must contain at least one item', 400, 'VALIDATION_ERROR');
  }

  return rawItems.map((item) => {
    const productId = String(item.id || item.productId || '').trim();
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new AppError(
        'Each item must have a valid id and integer quantity (1–99)',
        400,
        'VALIDATION_ERROR'
      );
    }
    return {
      productId,
      variant: item.variant || item.selectedVariant || null,
      quantity,
      requestedImage: item.image || null,
    };
  });
}

/**
 * Authoritatively computes product subtotal, promo discount, shipping, total, and canonical cart digest inside Firestore or an active transaction.
 */
export async function computeServerOrderQuote(firestore, rawItems, rawPromoCode = null, tx = null) {
  const normalizedItems = normalizeOrderItems(rawItems);
  const promoCode = String(rawPromoCode || '').trim().toUpperCase();

  const qtyByProductId = normalizedItems.reduce((acc, item) => {
    acc.set(item.productId, (acc.get(item.productId) || 0) + item.quantity);
    return acc;
  }, new Map());

  const uniqueIds = Array.from(qtyByProductId.keys());
  const productRefs = uniqueIds.map((id) => firestore.collection('products').doc(id));
  const readDoc = (ref) => (tx ? tx.get(ref) : ref.get());

  const [productSnaps, promoSnap] = await Promise.all([
    Promise.all(productRefs.map(readDoc)),
    promoCode ? readDoc(firestore.collection('promoCodes').doc(promoCode)) : Promise.resolve(null),
  ]);

  const productMap = new Map();
  productSnaps.forEach((snap, idx) => {
    const id = uniqueIds[idx];
    if (!snap.exists) {
      throw new AppError(`Product not found: ${id}`, 404, 'PRODUCT_NOT_FOUND');
    }
    const data = snap.data();
    const needed = qtyByProductId.get(id);
    const available = Number(data.stock ?? 0);
    if (available < needed) {
      throw new AppError(
        `Insufficient stock for ${data.name} (available: ${available}, requested: ${needed})`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }
    productMap.set(id, { ref: snap.ref, data, available });
  });

  let subtotal = 0;
  const orderItems = normalizedItems.map((item) => {
    const { data } = productMap.get(item.productId);
    const unitPrice = roundCurrency(data.price);
    const lineTotal = roundCurrency(unitPrice * item.quantity);
    subtotal += lineTotal;

    return {
      id: item.productId,
      name: data.name,
      variant: item.variant,
      price: unitPrice,
      quantity: item.quantity,
      lineTotal,
      image: item.requestedImage || data.image || '/images/products/prod-001-main.png',
    };
  });

  subtotal = roundCurrency(subtotal);

  let discountAmount = 0;
  let appliedCoupon = null;
  if (promoCode) {
    if (!promoSnap || !promoSnap.exists || promoSnap.data()?.active === false) {
      throw new AppError(`Invalid or inactive promo code: ${promoCode}`, 400, 'INVALID_PROMO');
    }
    const promo = promoSnap.data();
    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
      throw new AppError(`Promo code ${promoCode} has expired`, 400, 'PROMO_EXPIRED');
    }
    const minSubtotal = Number(promo.minSubtotal) || 0;
    if (subtotal < minSubtotal) {
      throw new AppError(
        `Minimum order subtotal of $${minSubtotal.toFixed(2)} required for ${promoCode}`,
        400,
        'PROMO_MIN_SUBTOTAL'
      );
    }
    discountAmount = calculateDiscountForPromo(promo, subtotal);
    appliedCoupon = promoCode;
  }

  const shippingFee = 0;
  const total = roundCurrency(Math.max(0, subtotal + shippingFee - discountAmount));
  const cartDigest = buildCartDigest(normalizedItems, appliedCoupon);

  return {
    normalizedItems,
    qtyByProductId,
    productMap,
    orderItems,
    subtotal,
    shippingFee,
    discountAmount,
    appliedCoupon,
    total,
    cartDigest,
  };
}

function makeSecurityError(message, statusCode, code, securityIncident) {
  const err = new AppError(message, statusCode, code);
  if (securityIncident) {
    err._securityIncident = securityIncident;
  }
  return err;
}

/**
 * Places an order atomically in Firestore: verifies prices & stock, requires server-verified payment (zero bypass/replay), deducts stock, and locks the payment receipt.
 */
export async function createOrder(payload = {}, user = null, req = null) {
  const firestore = ensureDb();
  if (!user?.uid) {
    throw new AppError('Authentication token is required to place an order', 401, 'AUTH_REQUIRED');
  }

  const shippingAddress = resolveShippingAddress(payload);
  const customerEmail = shippingAddress.email || user?.email || '';
  const promoCode = String(payload.promoCode || payload.appliedCoupon || '')
    .trim()
    .toUpperCase();
  const submittedTxId = String(payload.transactionId || '').trim();

  const orderId = generateOrderId();
  const orderRef = firestore.collection('orders').doc(orderId);

  let createdOrder;
  try {
    createdOrder = await firestore.runTransaction(async (tx) => {
      // 1. Perform ALL transaction reads up front (products, promo, and payment session)
      const payRef = submittedTxId.startsWith('KHQR-')
        ? firestore.collection('payments').doc(submittedTxId)
        : null;

      const [quote, paySnap] = await Promise.all([
        computeServerOrderQuote(firestore, payload.items, promoCode, tx),
        payRef ? tx.get(payRef) : Promise.resolve(null),
      ]);

      const {
        qtyByProductId,
        productMap,
        orderItems,
        subtotal,
        shippingFee,
        discountAmount,
        appliedCoupon,
        total,
        cartDigest,
      } = quote;

      const nowIso = new Date().toISOString();
      let verifiedBy = 'server_promo_zero';
      let verifiedPaymentMethod = 'Promo / Free Checkout ($0.00)';
      let verifiedTxId = `FREE-${orderId}`;
      let verifiedPayerName = String(payload.payerAccountName || '').trim().slice(0, 80);
      let verifiedTelegramUser = null;
      let paidAt = nowIso;

      // 2. Enforce strict Double-Protection Payment Gate when total > 0
      if (total > 0) {
        if (!submittedTxId || !submittedTxId.startsWith('KHQR-')) {
          throw makeSecurityError(
            'Verified Bakong KHQR payment is required before placing this order.',
            402,
            'PAYMENT_REQUIRED',
            {
              reason: 'PAYMENT_BYPASS_ATTEMPT',
              transactionId: submittedTxId || null,
              details: `Order ($${total.toFixed(2)}) attempted without valid KHQR transactionId (submitted="${submittedTxId || 'none'}")`,
            }
          );
        }

        if (!paySnap || !paySnap.exists) {
          throw makeSecurityError(
            'Payment transaction record not found.',
            402,
            'PAYMENT_NOT_FOUND',
            {
              reason: 'PAYMENT_BYPASS_ATTEMPT',
              transactionId: submittedTxId,
              details: `Non-existent transactionId=${submittedTxId} submitted for $${total.toFixed(2)} order`,
            }
          );
        }

        const pay = paySnap.data() || {};

        if (pay.userId && pay.userId !== user.uid && user.role !== 'admin') {
          throw makeSecurityError(
            'Payment session belongs to another account.',
            403,
            'PAYMENT_OWNERSHIP_MISMATCH',
            {
              reason: 'PAYMENT_OWNERSHIP_MISMATCH',
              transactionId: submittedTxId,
              details: `User ${user.uid} attempted to claim payment owned by ${pay.userId}`,
            }
          );
        }

        if (pay.consumedOrderId || pay.consumedAt) {
          throw makeSecurityError(
            'This KHQR payment has already been used for another order.',
            409,
            'PAYMENT_ALREADY_USED',
            {
              reason: 'PAYMENT_REPLAY_ATTEMPT',
              transactionId: submittedTxId,
              details: `Replay attempt on ${submittedTxId} already consumed by ${pay.consumedOrderId}`,
            }
          );
        }

        const allowedVerifiers = ['bakong_api', 'telegram_admin', 'luyriel_api', 'luyriel_webhook'];
        if (pay.status !== 'PAID' || !allowedVerifiers.includes(pay.verifiedBy)) {
          throw makeSecurityError(
            'KHQR payment has not been verified by Bakong, LuyRiel, or shop admin yet.',
            402,
            'PAYMENT_NOT_VERIFIED',
            {
              reason: 'UNVERIFIED_ORDER_BYPASS',
              transactionId: submittedTxId,
              details: `Unverified payment order blocked (status=${pay.status}, verifiedBy=${pay.verifiedBy || 'none'}, total=$${total.toFixed(2)})`,
            }
          );
        }

        if (!verifyPaymentProof(pay)) {
          throw makeSecurityError(
            'Payment cryptographic proof verification failed.',
            403,
            'PAYMENT_PROOF_INVALID',
            {
              reason: 'FORGED_PAYMENT_PROOF',
              transactionId: submittedTxId,
              details: `Invalid or forged HMAC verificationProof on payment ${submittedTxId}`,
            }
          );
        }

        if (!pay.cartDigest || pay.cartDigest !== cartDigest) {
          throw makeSecurityError(
            'Cart items or promo code changed after QR generation. Please generate a new KHQR.',
            400,
            'CART_TAMPER_DETECTED',
            {
              reason: 'CART_TAMPER_ATTEMPT',
              transactionId: submittedTxId,
              details: `Cart digest missing or mismatch on ${submittedTxId} for order total $${total.toFixed(2)}`,
            }
          );
        }

        const paidCurrency = String(pay.currency || 'USD').toUpperCase();
        const paidAmount = Number(pay.amount || 0);
        const amountSufficient =
          paidCurrency === 'KHR'
            ? paidAmount >= Math.max(1, Math.round(total * 4100))
            : paidAmount + 0.005 >= total;
        const expectedUsdSufficient =
          pay.expectedTotalUsd == null || Number(pay.expectedTotalUsd) + 0.005 >= total;

        if (!amountSufficient || !expectedUsdSufficient) {
          throw makeSecurityError(
            'Paid amount does not match the server-verified order total.',
            400,
            'PAYMENT_AMOUNT_MISMATCH',
            {
              reason: 'PAYMENT_AMOUNT_MISMATCH',
              transactionId: submittedTxId,
              details: `Underpayment blocked: paid=${paidAmount} ${paidCurrency} vs order total=$${total.toFixed(2)}`,
            }
          );
        }

        // Consume payment atomically so it can never be reused for a second order
        tx.update(payRef, {
          consumedOrderId: orderId,
          consumedByUid: user.uid,
          consumedAt: nowIso,
          orderId,
          updatedAt: FieldValue.serverTimestamp(),
        });

        verifiedBy = pay.verifiedBy;
        verifiedTxId = submittedTxId;
        const isLuyriel = String(verifiedBy || '').startsWith('luyriel') || pay.mode === 'luyriel';
        verifiedPaymentMethod = isLuyriel
          ? paidCurrency === 'KHR'
            ? 'ABA PayWay KHQR (KHR)'
            : 'ABA PayWay KHQR'
          : paidCurrency === 'KHR'
          ? 'KHQR Bakong (KHR)'
          : 'KHQR Bakong';
        verifiedPayerName = String(pay.payerAccountName || verifiedPayerName || '').trim().slice(0, 80);
        verifiedTelegramUser = pay.verifiedByTelegramUser || null;
        paidAt = pay.paidAt || nowIso;
      }

      // 3. Deduct stock atomically
      for (const [productId, needed] of qtyByProductId.entries()) {
        const { ref, available } = productMap.get(productId);
        tx.update(ref, {
          stock: available - needed,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const integrityHash = signOrderIntegrity({
        orderId,
        userId: user.uid,
        total,
        transactionId: verifiedTxId,
        verifiedBy,
        promoCode: appliedCoupon,
      });

      const orderDoc = {
        id: orderId,
        userId: user.uid,
        createdAt: nowIso,
        status: 'Confirmed',
        stepIndex: 1,
        paymentMethod: verifiedPaymentMethod,
        paymentStatus: 'Paid',
        payerAccountName: verifiedPayerName || null,
        transactionId: verifiedTxId,
        paymentVerification: {
          transactionId: verifiedTxId,
          verifiedBy,
          verifiedByTelegramUser: verifiedTelegramUser,
          paidAt,
          integrityHash,
        },
        subtotal,
        shippingFee,
        discount: discountAmount,
        discountAmount,
        total,
        appliedCoupon,
        customer: {
          ...shippingAddress,
          email: customerEmail,
        },
        shippingAddress: {
          ...shippingAddress,
          email: customerEmail,
        },
        items: orderItems,
        tracking: {
          courier: String(payload.courier || 'GrabExpress Dispatch'),
          courierWebsite: '',
          trackingCode: `TT-${orderId.slice(-8)}`,
          estimatedDelivery: 'Today by 5:30 PM',
          driverName: 'Pending Driver Assignment',
          driverPhone: 'Pending',
          events: [
            {
              status: 'Confirmed',
              location: 'TechTonic Online Store',
              note: `Payment verified (${verifiedBy}) & order confirmed`,
              timestamp: nowIso,
            },
          ],
        },
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.set(orderRef, orderDoc);

      const userRef = firestore.collection('users').doc(user.uid);
      tx.set(
        userRef,
        {
          ordersCount: FieldValue.increment(1),
          totalSpent: FieldValue.increment(total),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        ...orderDoc,
        updatedAt: nowIso,
      };
    });
  } catch (err) {
    if (err?._securityIncident) {
      reportPaymentSecurityIncident(req || user, err._securityIncident).catch(() => {});
    }
    throw err;
  }

  const emailPromise = sendOrderConfirmationEmail(createdOrder).catch(() => {});
  if (process.env.VERCEL === '1') {
    await Promise.race([emailPromise, new Promise((r) => setTimeout(r, 2500))]);
  }

  return toPublicOrder(createdOrder);
}

/**
 * Lists orders belonging to the authenticated user (matched by userId or verified email).
 */
export async function listUserOrders(user) {
  const firestore = ensureDb();
  const byIdQuery = await firestore.collection('orders').where('userId', '==', user.uid).get();
  const orderMap = new Map();

  byIdQuery.docs.forEach((doc) => {
    orderMap.set(doc.id, toPublicOrder({ id: doc.id, ...doc.data() }));
  });

  if (user.email && user.emailVerified) {
    const byEmailQuery = await firestore
      .collection('orders')
      .where('customer.email', '==', user.email)
      .get();
    byEmailQuery.docs.forEach((doc) => {
      if (!orderMap.has(doc.id)) {
        orderMap.set(doc.id, toPublicOrder({ id: doc.id, ...doc.data() }));
      }
    });
  }

  const orders = Array.from(orderMap.values());
  orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return orders;
}

/**
 * Fetches a single order by ID, enforcing ownership (or matching guest email/phone query for tracking).
 */
export async function getOrderById(orderId, user = null, lookup = {}) {
  const firestore = ensureDb();
  const cleanId = String(orderId || '').replace(/^#/, '').trim();
  const docSnap = await firestore.collection('orders').doc(cleanId).get();

  if (!docSnap.exists) {
    throw new AppError(`Order not found: ${cleanId}`, 404, 'ORDER_NOT_FOUND');
  }

  const order = { id: docSnap.id, ...docSnap.data() };

  const isAdmin = user?.role === 'admin';
  const isOwnerByUid = Boolean(user?.uid && order.userId === user.uid);
  const isOwnerByEmail = Boolean(
    user?.email &&
      user?.emailVerified &&
      order.customer?.email?.toLowerCase() === user.email.toLowerCase()
  );

  if (isAdmin || isOwnerByUid || isOwnerByEmail) {
    return toPublicOrder(order);
  }

  const lookupEmail = String(lookup.email || '').trim().toLowerCase();
  const lookupPhone = String(lookup.phone || '').replace(/\s+/g, '');
  const orderEmail = String(order.customer?.email || '').trim().toLowerCase();
  const orderPhone = String(order.customer?.phone || '').replace(/\s+/g, '');

  const guestVerified =
    (lookupEmail && orderEmail && lookupEmail === orderEmail) ||
    (lookupPhone && orderPhone && lookupPhone === orderPhone);

  if (guestVerified) {
    return toPublicOrder(order);
  }

  if (!user) {
    // Uniform 404 prevents unauthenticated callers from enumerating valid order IDs
    throw new AppError(`Order not found: ${cleanId}`, 404, 'ORDER_NOT_FOUND');
  }

  throw new AppError('You do not have permission to view this order', 403, 'FORBIDDEN');
}

