import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function normalizeSortValue(item) {
  return Number(item.sortOrder ?? 9999);
}

/**
 * Lists all product categories sorted by sortOrder then name.
 */
export async function listCategories() {
  const firestore = ensureDb();
  const snapshot = await firestore.collection('categories').get();
  const categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  categories.sort((a, b) => {
    const orderDiff = normalizeSortValue(a) - normalizeSortValue(b);
    if (orderDiff !== 0) return orderDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  return categories;
}

/**
 * Lists products with flexible filtering, search, sorting, and pagination.
 */
export async function listProducts(query = {}) {
  const firestore = ensureDb();
  const snapshot = await firestore.collection('products').get();
  let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const {
    category,
    subcategory,
    search,
    featured,
    bestSeller,
    inStock,
    minPrice,
    maxPrice,
    sort = 'featured',
    page = '1',
    limit = '50',
  } = query;

  if (category && category !== 'all') {
    const target = String(category).toLowerCase();
    items = items.filter(
      (p) =>
        String(p.category || '').toLowerCase() === target ||
        String(p.categoryId || '').toLowerCase() === target ||
        String(p.categoryName || '').toLowerCase() === target
    );
  }

  if (subcategory) {
    const targetSub = String(subcategory).toLowerCase();
    items = items.filter(
      (p) =>
        String(p.subcategorySlug || '').toLowerCase() === targetSub ||
        String(p.subcategory || '').toLowerCase() === targetSub
    );
  }

  if (featured === 'true') {
    items = items.filter((p) => Boolean(p.isFeatured));
  }

  if (bestSeller === 'true') {
    items = items.filter((p) => Boolean(p.isBestSeller));
  }

  if (inStock === 'true') {
    items = items.filter((p) => Number(p.stock) > 0);
  }

  if (minPrice !== undefined && minPrice !== '') {
    const min = Number(minPrice);
    if (!Number.isNaN(min)) {
      items = items.filter((p) => Number(p.price) >= min);
    }
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    const max = Number(maxPrice);
    if (!Number.isNaN(max)) {
      items = items.filter((p) => Number(p.price) <= max);
    }
  }

  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    items = items.filter((p) =>
      [p.name, p.tagline, p.description, p.categoryName, p.subcategory, p.badge]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }

  switch (sort) {
    case 'price-asc':
      items.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case 'price-desc':
      items.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case 'rating':
      items.sort((a, b) => Number(b.rating) - Number(a.rating) || Number(b.reviewsCount) - Number(a.reviewsCount));
      break;
    case 'newest':
      items.sort((a, b) => Number(b.sortOrder ?? 0) - Number(a.sortOrder ?? 0));
      break;
    case 'featured':
    default:
      items.sort((a, b) => {
        const featDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
        if (featDiff !== 0) return featDiff;
        const bestDiff = Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller));
        if (bestDiff !== 0) return bestDiff;
        return normalizeSortValue(a) - normalizeSortValue(b);
      });
      break;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limitNum));
  const offset = (pageNum - 1) * limitNum;
  const paginated = items.slice(offset, offset + limitNum);

  return {
    products: paginated,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  };
}

/**
 * Fetches a single product by document ID or slug, including its latest reviews.
 */
export async function getProductById(idOrSlug) {
  const firestore = ensureDb();
  const target = String(idOrSlug).trim();
  let productDoc = await firestore.collection('products').doc(target).get();

  if (!productDoc.exists) {
    const slugQuery = await firestore.collection('products').where('slug', '==', target).limit(1).get();
    if (!slugQuery.empty) {
      productDoc = slugQuery.docs[0];
    }
  }

  if (!productDoc.exists) {
    throw new AppError(`Product not found: ${target}`, 404, 'PRODUCT_NOT_FOUND');
  }

  const reviewsSnapshot = await productDoc.ref
    .collection('reviews')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const reviews = reviewsSnapshot.docs.map((doc) => {
    const { helpfulVoters: _omitVoters, ...rest } = doc.data() || {};
    return { id: doc.id, ...rest };
  });

  return {
    id: productDoc.id,
    ...productDoc.data(),
    reviews,
  };
}

/**
 * Lists reviews for a specific product.
 */
export async function listProductReviews(productId) {
  const product = await getProductById(productId);
  return product.reviews;
}

/**
 * Atomically adds a customer review and recalculates product rating & reviewsCount.
 */
export async function addProductReview(productId, payload = {}) {
  const firestore = ensureDb();
  const cleanText = (val, maxLen) =>
    String(val || '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLen);

  const author = cleanText(payload.author || payload.name, 80);
  const comment = cleanText(payload.comment, 1500);
  const title = cleanText(payload.title, 120) || 'Verified TechTonic Customer Review';
  const location = cleanText(payload.location, 80) || 'Phnom Penh, Cambodia';
  const rating = Number(payload.rating);

  if (!payload.userId) {
    throw new AppError('Authentication is required to post a review', 401, 'AUTH_REQUIRED');
  }
  if (!author) {
    throw new AppError('Reviewer name is required', 400, 'VALIDATION_ERROR');
  }
  if (!comment) {
    throw new AppError('Review comment is required', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be a number between 1 and 5', 400, 'VALIDATION_ERROR');
  }

  const productRef = firestore.collection('products').doc(String(productId).trim());
  const reviewRef = productRef.collection('reviews').doc();

  const createdReview = await firestore.runTransaction(async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists) {
      throw new AppError(`Product not found: ${productId}`, 404, 'PRODUCT_NOT_FOUND');
    }

    const currentData = productSnap.data();
    const prevCount = Number(currentData.reviewsCount) || 0;
    const prevRating = Number(currentData.rating) || 0;
    const nextCount = prevCount + 1;
    const nextRating = Math.round(((prevRating * prevCount + rating) / nextCount) * 10) / 10;

    const nowIso = new Date().toISOString();
    const reviewDoc = {
      id: reviewRef.id,
      productId: productRef.id,
      author,
      location,
      rating,
      date: nowIso.slice(0, 10),
      verified: Boolean(payload.userId),
      userId: payload.userId,
      title,
      comment,
      helpful: 0,
      createdAt: nowIso,
    };

    tx.set(reviewRef, reviewDoc);
    tx.update(productRef, {
      rating: nextRating,
      reviewsCount: nextCount,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { review: reviewDoc, rating: nextRating, reviewsCount: nextCount };
  });

  return createdReview;
}

/**
 * Atomically increments a customer review's persisted helpful count (one vote per authenticated user).
 */
export async function markReviewHelpful(productId, reviewId, userId = null) {
  const firestore = ensureDb();
  const cleanProductId = String(productId || '').trim();
  const cleanReviewId = String(reviewId || '').trim();
  const cleanUid = String(userId || '').trim();

  if (!cleanUid) {
    throw new AppError('Sign in to vote on reviews', 401, 'AUTH_REQUIRED');
  }
  if (!cleanProductId || !cleanReviewId) {
    throw new AppError('Product ID and review ID are required', 400, 'VALIDATION_ERROR');
  }

  const reviewRef = firestore
    .collection('products')
    .doc(cleanProductId)
    .collection('reviews')
    .doc(cleanReviewId);

  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(reviewRef);
    if (!snap.exists) {
      throw new AppError(`Review not found: ${cleanReviewId}`, 404, 'REVIEW_NOT_FOUND');
    }

    const data = snap.data() || {};
    const voters = Array.isArray(data.helpfulVoters) ? data.helpfulVoters : [];
    if (voters.includes(cleanUid)) {
      throw new AppError('You already marked this review as helpful', 409, 'ALREADY_VOTED');
    }

    const nextHelpful = Number(data.helpful || 0) + 1;
    tx.update(reviewRef, {
      helpful: nextHelpful,
      helpfulVoters: FieldValue.arrayUnion(cleanUid),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const { helpfulVoters: _omitVoters, ...safeReview } = data;
    return {
      id: snap.id,
      ...safeReview,
      helpful: nextHelpful,
    };
  });
}

