import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateDiscountForPromo } from './promoService.js';
import { sendOrderConfirmationEmail } from './emailService.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function generateOrderId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
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
  const fullName = String(raw.fullName || payload.customerName || '').trim();
  const phone = String(raw.phone || payload.customerPhone || '').trim();
  const email = String(raw.email || payload.customerEmail || '').trim();
  const address = String(raw.address || '').trim();
  const city = String(raw.city || '').trim();
  const province = String(raw.province || 'Phnom Penh').trim();
  const postalCode = String(raw.postalCode || '12000').trim();

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
 * Places an order atomically in Firestore: verifies product prices & stock, applies promo, deducts stock, and creates the order.
 */
export async function createOrder(payload = {}, user = null) {
  const firestore = ensureDb();
  const rawItems = Array.isArray(payload.items) ? payload.items : [];

  if (rawItems.length === 0) {
    throw new AppError('Order must contain at least one item', 400, 'VALIDATION_ERROR');
  }

  const shippingAddress = resolveShippingAddress(payload);
  const customerEmail = shippingAddress.email || user?.email || '';

  const normalizedItems = rawItems.map((item) => {
    const productId = String(item.id || item.productId || '').trim();
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new AppError('Each item must have a valid id and positive integer quantity', 400, 'VALIDATION_ERROR');
    }
    return {
      productId,
      variant: item.variant || item.selectedVariant || null,
      quantity,
      requestedImage: item.image || null,
    };
  });

  const qtyByProductId = normalizedItems.reduce((acc, item) => {
    acc.set(item.productId, (acc.get(item.productId) || 0) + item.quantity);
    return acc;
  }, new Map());

  const promoCode = String(payload.promoCode || payload.appliedCoupon || '')
    .trim()
    .toUpperCase();

  const orderId = generateOrderId();
  const orderRef = firestore.collection('orders').doc(orderId);

  const createdOrder = await firestore.runTransaction(async (tx) => {
    const uniqueIds = Array.from(qtyByProductId.keys());
    const productRefs = uniqueIds.map((id) => firestore.collection('products').doc(id));
    const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

    let promoSnap = null;
    if (promoCode) {
      promoSnap = await tx.get(firestore.collection('promoCodes').doc(promoCode));
    }

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

    const shippingFee = subtotal >= 100 || subtotal === 0 ? 0 : 5;
    const total = roundCurrency(Math.max(0, subtotal + shippingFee - discountAmount));

    // Deduct stock atomically
    for (const [productId, needed] of qtyByProductId.entries()) {
      const { ref, available } = productMap.get(productId);
      tx.update(ref, {
        stock: available - needed,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const nowIso = new Date().toISOString();
    const isPaid = Boolean(payload.transactionId) || String(payload.paymentStatus || '').toLowerCase() === 'paid';
    const orderDoc = {
      id: orderId,
      userId: user?.uid || null,
      createdAt: nowIso,
      status: 'Confirmed',
      stepIndex: 1,
      paymentMethod: String(payload.paymentMethod || 'Bakong KHQR (ABA Bank)').trim(),
      paymentStatus: isPaid ? 'Paid' : 'Pending',
      transactionId:
        payload.transactionId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
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
            note: isPaid ? 'Payment verified & order confirmed' : 'Order confirmed (Cash on Delivery)',
            timestamp: nowIso,
          },
        ],
      },
      updatedAt: FieldValue.serverTimestamp(),
    };

    tx.set(orderRef, orderDoc);

    if (user?.uid) {
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
    }

    return {
      ...orderDoc,
      updatedAt: nowIso,
    };
  });

  sendOrderConfirmationEmail(createdOrder).catch(() => {});

  return createdOrder;
}

/**
 * Lists orders belonging to the authenticated user (matched by userId or email).
 */
export async function listUserOrders(user) {
  const firestore = ensureDb();
  const byIdQuery = await firestore.collection('orders').where('userId', '==', user.uid).get();
  const orderMap = new Map();

  byIdQuery.docs.forEach((doc) => {
    orderMap.set(doc.id, { id: doc.id, ...doc.data() });
  });

  if (user.email) {
    const byEmailQuery = await firestore
      .collection('orders')
      .where('customer.email', '==', user.email)
      .get();
    byEmailQuery.docs.forEach((doc) => {
      if (!orderMap.has(doc.id)) {
        orderMap.set(doc.id, { id: doc.id, ...doc.data() });
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
    user?.email && order.customer?.email?.toLowerCase() === user.email.toLowerCase()
  );

  if (isAdmin || isOwnerByUid || isOwnerByEmail) {
    return order;
  }

  const lookupEmail = String(lookup.email || '').trim().toLowerCase();
  const lookupPhone = String(lookup.phone || '').replace(/\s+/g, '');
  const orderEmail = String(order.customer?.email || '').trim().toLowerCase();
  const orderPhone = String(order.customer?.phone || '').replace(/\s+/g, '');

  const guestVerified =
    (lookupEmail && orderEmail && lookupEmail === orderEmail) ||
    (lookupPhone && orderPhone && lookupPhone === orderPhone);

  if (guestVerified) {
    return order;
  }

  if (!user) {
    throw new AppError(
      'Sign in or provide matching email/phone to view this order',
      401,
      'AUTH_REQUIRED'
    );
  }

  throw new AppError('You do not have permission to view this order', 403, 'FORBIDDEN');
}

