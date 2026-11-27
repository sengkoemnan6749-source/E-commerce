import { FieldValue } from 'firebase-admin/firestore';
import { auth, db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { mapStatusToStepIndex } from './orderService.js';
import { sendOrderStatusEmail } from './emailService.js';
import { notifyOrderStatusUpdate } from './telegramService.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates URLs stored in catalog/order records so javascript:/data: payloads cannot be persisted.
 */
function sanitizeSafeUrl(rawUrl, { allowRelative = true, allowEmpty = false, fieldName = 'URL' } = {}) {
  const value = String(rawUrl ?? '').trim();
  if (!value) {
    if (allowEmpty) return '';
    throw new AppError(`${fieldName} cannot be empty`, 400, 'VALIDATION_ERROR');
  }
  if (allowRelative && value.startsWith('/') && !value.startsWith('//')) {
    if (/[\r\n<>'"`]/.test(value)) {
      throw new AppError(`Invalid ${fieldName} format`, 400, 'VALIDATION_ERROR');
    }
    return value;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Disallowed protocol');
    }
    return parsed.toString();
  } catch {
    throw new AppError(
      `Invalid ${fieldName}. Only https://, http://${allowRelative ? ', or local /images/ paths' : ''} are allowed.`,
      400,
      'VALIDATION_ERROR'
    );
  }
}

const CANONICAL_STATUSES = new Map([
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['processing', 'Processing'],
  ['packing', 'Processing'],
  ['shipped', 'Shipped'],
  ['out for delivery', 'Out for Delivery'],
  ['out_for_delivery', 'Out for Delivery'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
]);

async function syncCategoryItemCount(firestore, categoryId) {
  if (!categoryId) return;
  const catRef = firestore.collection('categories').doc(String(categoryId));
  const catSnap = await catRef.get();
  if (!catSnap.exists) return;

  const productsSnap = await firestore
    .collection('products')
    .where('category', '==', String(categoryId))
    .get();

  await catRef.update({
    itemCount: productsSnap.size,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Aggregates live storefront metrics for the Admin Console dashboard.
 */
export async function getDashboardStats() {
  const firestore = ensureDb();
  const [productsSnap, categoriesSnap, ordersSnap, usersSnap] = await Promise.all([
    firestore.collection('products').get(),
    firestore.collection('categories').get(),
    firestore.collection('orders').get(),
    firestore.collection('users').get(),
  ]);

  const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const categories = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const customers = usersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.role !== 'admin');

  orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  const activeOrders = orders.filter((o) => String(o.status || '').toLowerCase() !== 'cancelled');
  const totalRevenue = Math.round(
    activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 100
  ) / 100;

  const pendingStatuses = new Set(['pending', 'confirmed', 'processing']);
  const pendingOrdersCount = orders.filter((o) =>
    pendingStatuses.has(String(o.status || '').toLowerCase())
  ).length;
  const deliveredOrdersCount = orders.filter(
    (o) => String(o.status || '').toLowerCase() === 'delivered'
  ).length;

  const lowStockProducts = products
    .filter((p) => Number(p.stock ?? 0) <= 10)
    .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0));

  const topProducts = [...products]
    .sort((a, b) => Number(b.reviewsCount ?? 0) - Number(a.reviewsCount ?? 0))
    .slice(0, 5);

  const paymentBreakdown = activeOrders.reduce(
    (acc, o) => {
      const method = String(o.paymentMethod || '').toLowerCase();
      const amt = Number(o.total) || 0;
      acc.khqrCount += 1;
      acc.khqrRevenue = Math.round((acc.khqrRevenue + amt) * 100) / 100;
      if (method.includes('(khr)') || method.includes('riel') || method.includes('៛')) {
        acc.khqrKhrCount += 1;
        acc.khqrKhrRevenue = Math.round((acc.khqrKhrRevenue + amt) * 100) / 100;
      } else {
        acc.khqrUsdCount += 1;
        acc.khqrUsdRevenue = Math.round((acc.khqrUsdRevenue + amt) * 100) / 100;
      }
      return acc;
    },
    {
      khqrCount: 0,
      khqrRevenue: 0,
      khqrUsdCount: 0,
      khqrUsdRevenue: 0,
      khqrKhrCount: 0,
      khqrKhrRevenue: 0,
    }
  );

  return {
    summary: {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrdersCount,
      deliveredOrdersCount,
      totalProducts: products.length,
      totalCategories: categories.length,
      totalCustomers: customers.length,
      lowStockCount: lowStockProducts.length,
    },
    paymentBreakdown,
    lowStockProducts,
    recentOrders: orders.slice(0, 5),
    topProducts,
  };
}

/**
 * Creates a new product in Firestore and updates category item count.
 */
export async function createProduct(payload = {}) {
  const firestore = ensureDb();
  const name = String(payload.name || '').trim();
  const price = Number(payload.price);
  const category = String(payload.category || payload.categoryId || '').trim();

  if (!name) {
    throw new AppError('Product name is required', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new AppError('Valid product price is required', 400, 'VALIDATION_ERROR');
  }
  if (!category) {
    throw new AppError('Product category is required', 400, 'VALIDATION_ERROR');
  }

  const productId = String(payload.id || `prod-${Date.now()}`).trim();
  const productRef = firestore.collection('products').doc(productId);
  const existing = await productRef.get();
  if (existing.exists) {
    throw new AppError(`Product already exists: ${productId}`, 409, 'PRODUCT_EXISTS');
  }

  const catSnap = await firestore.collection('categories').doc(category).get();
  const categoryName = payload.categoryName || catSnap.data()?.name || category;

  const rawPrimaryImage = payload.image || payload.images?.[0] || '/images/products/prod-001-main.png';
  const primaryImage = sanitizeSafeUrl(rawPrimaryImage, { allowRelative: true, fieldName: 'product image' });
  const rawImages = Array.isArray(payload.images) && payload.images.length > 0 ? payload.images : [primaryImage];
  const images = rawImages
    .slice(0, 12)
    .map((img) => sanitizeSafeUrl(img, { allowRelative: true, fieldName: 'product gallery image' }));

  const docData = {
    id: productId,
    slug: payload.slug || slugify(name) || productId,
    name,
    category,
    categoryId: category,
    categoryName,
    subcategory: payload.subcategory || null,
    subcategorySlug: payload.subcategorySlug || (payload.subcategory ? slugify(payload.subcategory) : null),
    price: Math.round(price * 100) / 100,
    originalPrice:
      payload.originalPrice != null && payload.originalPrice !== ''
        ? Number(payload.originalPrice)
        : null,
    rating: Number(payload.rating ?? 5.0),
    reviewsCount: Number(payload.reviewsCount ?? 0),
    stock: Math.max(0, parseInt(payload.stock ?? 0, 10) || 0),
    isBestSeller: Boolean(payload.isBestSeller),
    isFeatured: Boolean(payload.isFeatured),
    badge: payload.badge || null,
    tagline: String(payload.tagline || '').trim(),
    description: String(payload.description || '').trim(),
    image: primaryImage,
    secondaryImage: images[1] || primaryImage,
    images,
    gallery: images,
    variants: Array.isArray(payload.variants) ? payload.variants : [],
    specs: payload.specs || {},
    inBox: Array.isArray(payload.inBox) ? payload.inBox : [],
    createdAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await productRef.set(docData);
  await syncCategoryItemCount(firestore, category);

  return docData;
}

/**
 * Updates an existing product in Firestore.
 */
export async function updateProduct(productId, payload = {}) {
  const firestore = ensureDb();
  const id = String(productId).trim();
  const productRef = firestore.collection('products').doc(id);
  const snap = await productRef.get();

  if (!snap.exists) {
    throw new AppError(`Product not found: ${id}`, 404, 'PRODUCT_NOT_FOUND');
  }

  const current = snap.data();
  const updates = { updatedAt: FieldValue.serverTimestamp() };

  const stringFields = ['name', 'category', 'categoryId', 'categoryName', 'subcategory', 'subcategorySlug', 'badge', 'tagline', 'description', 'slug'];
  for (const field of stringFields) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field] === null ? null : String(payload[field]).trim();
    }
  }
  if (payload.image !== undefined && payload.image !== null) {
    updates.image = sanitizeSafeUrl(payload.image, { allowRelative: true, fieldName: 'product image' });
  }

  if (payload.category !== undefined && payload.categoryId === undefined) {
    updates.categoryId = updates.category;
  }
  if (payload.price !== undefined) {
    const price = Number(payload.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new AppError('Price must be a non-negative number', 400, 'VALIDATION_ERROR');
    }
    updates.price = Math.round(price * 100) / 100;
  }
  if (payload.originalPrice !== undefined) {
    updates.originalPrice = payload.originalPrice === null || payload.originalPrice === '' ? null : Number(payload.originalPrice);
  }
  if (payload.stock !== undefined) {
    const stock = parseInt(payload.stock, 10);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new AppError('Stock must be a non-negative integer', 400, 'VALIDATION_ERROR');
    }
    updates.stock = stock;
  }
  if (payload.isBestSeller !== undefined) updates.isBestSeller = Boolean(payload.isBestSeller);
  if (payload.isFeatured !== undefined) updates.isFeatured = Boolean(payload.isFeatured);
  if (Array.isArray(payload.images)) {
    const cleanImages = payload.images
      .slice(0, 12)
      .map((img) => sanitizeSafeUrl(img, { allowRelative: true, fieldName: 'product gallery image' }));
    updates.images = cleanImages;
    updates.gallery = cleanImages;
    if (!updates.image && cleanImages[0]) updates.image = cleanImages[0];
  }
  if (Array.isArray(payload.variants)) updates.variants = payload.variants;
  if (payload.specs && typeof payload.specs === 'object') updates.specs = payload.specs;
  if (Array.isArray(payload.inBox)) updates.inBox = payload.inBox;

  await productRef.set(updates, { merge: true });

  const prevCategory = current.category;
  const nextCategory = updates.category || prevCategory;
  await syncCategoryItemCount(firestore, nextCategory);
  if (prevCategory && prevCategory !== nextCategory) {
    await syncCategoryItemCount(firestore, prevCategory);
  }

  const refreshed = await productRef.get();
  return { id: refreshed.id, ...refreshed.data() };
}

/**
 * Deletes a product and its review subcollection from Firestore.
 */
export async function deleteProduct(productId) {
  const firestore = ensureDb();
  const id = String(productId).trim();
  const productRef = firestore.collection('products').doc(id);
  const snap = await productRef.get();

  if (!snap.exists) {
    throw new AppError(`Product not found: ${id}`, 404, 'PRODUCT_NOT_FOUND');
  }

  const prevCategory = snap.data()?.category;
  const reviewsSnap = await productRef.collection('reviews').get();
  const batch = firestore.batch();
  reviewsSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(productRef);
  await batch.commit();

  await syncCategoryItemCount(firestore, prevCategory);
  return { deletedId: id };
}

/**
 * Creates a new category in Firestore.
 */
export async function createCategory(payload = {}) {
  const firestore = ensureDb();
  const name = String(payload.name || '').trim();
  if (!name) {
    throw new AppError('Category name is required', 400, 'VALIDATION_ERROR');
  }

  const slug = slugify(payload.slug || name);
  const id = String(payload.id || slug).trim();
  const catRef = firestore.collection('categories').doc(id);
  const existing = await catRef.get();
  if (existing.exists) {
    throw new AppError(`Category already exists: ${id}`, 409, 'CATEGORY_EXISTS');
  }

  const docData = {
    id,
    name,
    slug,
    description: String(payload.description || '').trim(),
    image: sanitizeSafeUrl(payload.image || '/images/products/prod-001-main.png', {
      allowRelative: true,
      fieldName: 'category image',
    }),
    badge: payload.badge || null,
    itemCount: 0,
    subcategories: Array.isArray(payload.subcategories) ? payload.subcategories : [],
    sortOrder: Number(payload.sortOrder ?? 99),
    createdAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await catRef.set(docData);
  return docData;
}

/**
 * Updates an existing category in Firestore.
 */
export async function updateCategory(categoryId, payload = {}) {
  const firestore = ensureDb();
  const id = String(categoryId).trim();
  const catRef = firestore.collection('categories').doc(id);
  const snap = await catRef.get();

  if (!snap.exists) {
    throw new AppError(`Category not found: ${id}`, 404, 'CATEGORY_NOT_FOUND');
  }

  const updates = { updatedAt: FieldValue.serverTimestamp() };
  for (const field of ['name', 'slug', 'description', 'badge']) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field] === null ? null : String(payload[field]).trim();
    }
  }
  if (payload.image !== undefined && payload.image !== null) {
    updates.image = sanitizeSafeUrl(payload.image, { allowRelative: true, fieldName: 'category image' });
  }
  if (Array.isArray(payload.subcategories)) updates.subcategories = payload.subcategories;
  if (payload.sortOrder !== undefined) updates.sortOrder = Number(payload.sortOrder);

  await catRef.set(updates, { merge: true });
  const refreshed = await catRef.get();
  return { id: refreshed.id, ...refreshed.data() };
}

/**
 * Deletes an empty category from Firestore.
 */
export async function deleteCategory(categoryId) {
  const firestore = ensureDb();
  const id = String(categoryId).trim();
  const catRef = firestore.collection('categories').doc(id);
  const snap = await catRef.get();

  if (!snap.exists) {
    throw new AppError(`Category not found: ${id}`, 404, 'CATEGORY_NOT_FOUND');
  }

  const attachedProducts = await firestore
    .collection('products')
    .where('category', '==', id)
    .limit(1)
    .get();

  if (!attachedProducts.empty) {
    throw new AppError(
      'Cannot delete category that still contains products',
      409,
      'CATEGORY_NOT_EMPTY'
    );
  }

  await catRef.delete();
  return { deletedId: id };
}

/**
 * Lists all store orders with optional status filter, search, and pagination.
 */
export async function listAllOrders(query = {}) {
  const firestore = ensureDb();
  const snapshot = await firestore.collection('orders').get();
  let orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  const statusCounts = orders.reduce((acc, o) => {
    const key = String(o.status || 'Confirmed').toLowerCase().replace(/\s+/g, '_');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const { status, search, page = '1', limit = '50' } = query;

  if (status && String(status).toLowerCase() !== 'all') {
    const target = String(status).toLowerCase().replace(/\s+/g, '_');
    orders = orders.filter(
      (o) => String(o.status || '').toLowerCase().replace(/\s+/g, '_') === target
    );
  }

  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    orders = orders.filter((o) =>
      [
        o.id,
        o.transactionId,
        o.customer?.fullName,
        o.customer?.email,
        o.customer?.phone,
        o.paymentMethod,
      ]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / limitNum));
  const offset = (pageNum - 1) * limitNum;

  return {
    orders: orders.slice(offset, offset + limitNum),
    statusCounts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  };
}

const STEP_SEQUENCE = ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

function dedupeParts(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const clean = String(part || '').trim();
    if (!clean || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    out.push(clean);
  }
  return out.join(', ');
}

/**
 * Updates an order's fulfillment status, payment status, or courier tracking details.
 */
export async function updateOrderStatus(orderId, payload = {}) {
  const firestore = ensureDb();
  const cleanId = String(orderId || '').replace(/^#/, '').trim();
  const orderRef = firestore.collection('orders').doc(cleanId);
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new AppError(`Order not found: ${cleanId}`, 404, 'ORDER_NOT_FOUND');
  }

  const existingData = snap.data() || {};
  const previousStatus = existingData.status || '';
  const updates = { updatedAt: FieldValue.serverTimestamp() };
  let nextCanonicalStatus = null;

  if (payload.status !== undefined) {
    const rawKey = String(payload.status).trim().toLowerCase();
    const canonical = CANONICAL_STATUSES.get(rawKey);
    if (!canonical) {
      throw new AppError(
        `Invalid order status "${payload.status}". Allowed: Pending, Confirmed, Processing, Shipped, Out for Delivery, Delivered, Cancelled`,
        400,
        'VALIDATION_ERROR'
      );
    }
    updates.status = canonical;
    updates.stepIndex = canonical === 'Shipped' ? 3 : mapStatusToStepIndex(canonical);
    nextCanonicalStatus = canonical;
  }

  if (payload.paymentStatus !== undefined) {
    updates.paymentStatus = String(payload.paymentStatus).trim();
  }

  const currentTracking = existingData.tracking || {};
  const nextTracking = { ...currentTracking };
  if (payload.tracking && typeof payload.tracking === 'object') {
    const allowedTrackingStrings = [
      'courier',
      'trackingCode',
      'estimatedDelivery',
      'driverName',
      'driverPhone',
      'location',
    ];
    for (const key of allowedTrackingStrings) {
      if (typeof payload.tracking[key] === 'string') {
        nextTracking[key] = payload.tracking[key].replace(/[<>]/g, '').trim().slice(0, 120);
      }
    }
    if (payload.tracking.courierWebsite !== undefined) {
      nextTracking.courierWebsite = sanitizeSafeUrl(payload.tracking.courierWebsite, {
        allowRelative: false,
        allowEmpty: true,
        fieldName: 'courierWebsite',
      });
    }
  }

  if (nextCanonicalStatus) {
    const existingEvents = Array.isArray(nextTracking.events) ? [...nextTracking.events] : [];
    const addr = existingData.shippingAddress || existingData.customer || {};
    const destLabel = dedupeParts([addr.city, addr.province]) || 'Phnom Penh';
    const fullAddress = dedupeParts([addr.address, addr.city, addr.province]) || destLabel;
    const defaultLocations = {
      Confirmed: 'TechTonic Online Store',
      Processing: 'TechTonic Toul Kork Hub (St 598)',
      Shipped: `Dispatched via ${nextTracking.courier || 'Courier Fleet'}`,
      'Out for Delivery': `En route to ${destLabel}`,
      Delivered: fullAddress,
      Cancelled: 'TechTonic Support Desk',
    };

    const nowMs = Date.now();
    const targetIdx = STEP_SEQUENCE.indexOf(nextCanonicalStatus);
    if (targetIdx > 0) {
      const seenStatuses = new Set(existingEvents.map((e) => String(e.status || '').toLowerCase()));
      for (let i = 0; i < targetIdx; i++) {
        const intermediate = STEP_SEQUENCE[i];
        if (!seenStatuses.has(intermediate.toLowerCase())) {
          existingEvents.push({
            status: intermediate,
            location: defaultLocations[intermediate] || 'TechTonic Logistics',
            note: `Order moved to ${intermediate}`,
            timestamp: new Date(nowMs - (targetIdx - i) * 1000).toISOString(),
          });
          seenStatuses.add(intermediate.toLowerCase());
        }
      }
    }

    existingEvents.push({
      status: nextCanonicalStatus,
      location:
        (payload.tracking && typeof payload.tracking.location === 'string' && payload.tracking.location.trim()) ||
        defaultLocations[nextCanonicalStatus] ||
        'TechTonic Logistics',
      note:
        (typeof payload.note === 'string' && payload.note.trim()) ||
        `Order moved to ${nextCanonicalStatus}`,
      timestamp: new Date(nowMs).toISOString(),
    });
    nextTracking.events = existingEvents.slice(-20);
  }

  if (nextCanonicalStatus || (payload.tracking && typeof payload.tracking === 'object')) {
    updates.tracking = nextTracking;
  }

  await orderRef.set(updates, { merge: true });
  const refreshed = await orderRef.get();
  const updatedOrder = { id: refreshed.id, ...refreshed.data() };

  if (nextCanonicalStatus && nextCanonicalStatus !== previousStatus) {
    const notifyPromises = Promise.allSettled([
      sendOrderStatusEmail(updatedOrder, previousStatus),
      notifyOrderStatusUpdate(updatedOrder, previousStatus),
    ]);
    if (process.env.VERCEL === '1') {
      await Promise.race([notifyPromises, new Promise((r) => setTimeout(r, 2500))]);
    }
  }

  return updatedOrder;
}

function getEnvAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Lists all registered users (customers & admins) for Admin Directory / Role Management.
 */
export async function listAllCustomers(query = {}) {
  const firestore = ensureDb();
  const envAdmins = getEnvAdminEmails();
  const snapshot = await firestore.collection('users').get();
  let users = snapshot.docs.map((doc) => {
    const data = doc.data() || {};
    const emailLower = String(data.email || '').trim().toLowerCase();
    const isPrimaryAdmin = Boolean(emailLower && envAdmins.includes(emailLower));
    const role = isPrimaryAdmin || data.role === 'admin' ? 'admin' : 'customer';
    return {
      id: doc.id,
      ...data,
      role,
      isPrimaryAdmin,
    };
  });

  const { search, status, role: roleFilter } = query;

  if (roleFilter && String(roleFilter).toLowerCase() !== 'all') {
    const targetRole = String(roleFilter).trim().toLowerCase();
    users = users.filter((u) => u.role === targetRole);
  }

  if (status && String(status).toLowerCase() !== 'all') {
    const target = String(status).trim().toLowerCase();
    users = users.filter((c) => String(c.status || 'Active').toLowerCase() === target);
  }

  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    users = users.filter((c) =>
      [c.name, c.fullName, c.email, c.phone]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }

  users.sort((a, b) => {
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
    return Number(b.totalSpent ?? 0) - Number(a.totalSpent ?? 0);
  });
  return users;
}

/**
 * Promotes or demotes a registered user between 'admin' and 'customer' roles in Firestore and Firebase Auth claims.
 */
export async function updateUserRole(targetUserId, payload = {}, actorUser = null) {
  const firestore = ensureDb();
  const cleanId = String(targetUserId || '').trim();
  const nextRole = String(payload?.role || '').trim().toLowerCase();

  if (!cleanId) {
    throw new AppError('User ID is required', 400, 'VALIDATION_ERROR');
  }
  if (nextRole !== 'admin' && nextRole !== 'customer') {
    throw new AppError('Role must be admin or customer', 400, 'VALIDATION_ERROR');
  }

  const userRef = firestore.collection('users').doc(cleanId);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
  }

  const existing = snap.data() || {};
  const emailLower = String(existing.email || '').trim().toLowerCase();
  const envAdmins = getEnvAdminEmails();
  const isPrimaryAdmin = Boolean(emailLower && envAdmins.includes(emailLower));
  const previousRole = isPrimaryAdmin || existing.role === 'admin' ? 'admin' : 'customer';

  if (actorUser?.uid && actorUser.uid === cleanId && nextRole !== 'admin') {
    throw new AppError('You cannot remove your own admin role.', 400, 'SELF_DEMOTION_BLOCKED');
  }

  if (isPrimaryAdmin && nextRole !== 'admin') {
    throw new AppError('Primary environment admin cannot be demoted.', 400, 'PRIMARY_ADMIN_PROTECTED');
  }

  const nowIso = new Date().toISOString();
  await userRef.set(
    {
      role: nextRole,
      roleUpdatedAt: nowIso,
      roleUpdatedBy: actorUser?.email || actorUser?.uid || null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (auth) {
    try {
      const fbUser = await auth.getUser(cleanId);
      const nextClaims = {
        ...(fbUser.customClaims || {}),
        role: nextRole,
        admin: nextRole === 'admin',
      };
      await auth.setCustomUserClaims(cleanId, nextClaims);
      if (nextRole !== 'admin') {
        await auth.revokeRefreshTokens(cleanId);
      }
    } catch {
      // Firestore role remains authoritative via authMiddleware lookup even if UID is non-Firebase
    }
  }

  const refreshed = await userRef.get();
  return {
    id: refreshed.id,
    ...refreshed.data(),
    previousRole,
    role: nextRole,
    isPrimaryAdmin,
  };
}

