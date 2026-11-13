import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

export function calculateDiscountForPromo(promo, subtotal) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (!promo) return 0;

  if (promo.type === 'percentage') {
    const pct = Math.min(100, Math.max(0, Number(promo.value) || 0));
    return Math.round(safeSubtotal * (pct / 100) * 100) / 100;
  }

  const fixed = Math.max(0, Number(promo.value) || 0);
  return Math.round(Math.min(safeSubtotal, fixed) * 100) / 100;
}

/**
 * Validates a promo code against Firestore promoCodes collection.
 */
export async function validatePromoCode(code, subtotal = 0) {
  const firestore = ensureDb();
  const normalized = String(code || '').trim().toUpperCase();

  if (!normalized) {
    throw new AppError('Promo code is required', 400, 'VALIDATION_ERROR');
  }

  const docSnap = await firestore.collection('promoCodes').doc(normalized).get();
  if (!docSnap.exists) {
    throw new AppError('Invalid promo code. Try TECH10 or SAVE5.', 400, 'INVALID_PROMO');
  }

  const promo = docSnap.data();
  if (promo.active === false) {
    throw new AppError('This promo code is no longer active', 400, 'PROMO_INACTIVE');
  }

  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    throw new AppError('This promo code has expired', 400, 'PROMO_EXPIRED');
  }

  const minSubtotal = Number(promo.minSubtotal) || 0;
  const safeSubtotal = Number(subtotal) || 0;
  if (safeSubtotal > 0 && safeSubtotal < minSubtotal) {
    throw new AppError(
      `Minimum order subtotal of $${minSubtotal.toFixed(2)} required for ${normalized}`,
      400,
      'PROMO_MIN_SUBTOTAL'
    );
  }

  const discountAmount = calculateDiscountForPromo(promo, safeSubtotal || Number(promo.value) || 0);

  return {
    valid: true,
    code: normalized,
    type: promo.type || 'fixed',
    value: Number(promo.value) || 0,
    discountAmount,
    message: promo.description || `Promo code applied: $${discountAmount.toFixed(2)} off!`,
  };
}

function normalizePromoPayload(payload = {}, existing = null) {
  const code = String(payload.code ?? existing?.code ?? '')
    .trim()
    .toUpperCase();
  if (!code || !/^[A-Z0-9_-]{2,32}$/.test(code)) {
    throw new AppError(
      'Promo code must be 2–32 characters (letters, numbers, underscore, or hyphen)',
      400,
      'VALIDATION_ERROR'
    );
  }

  const type = payload.type === 'percentage' || (!payload.type && existing?.type === 'percentage')
    ? 'percentage'
    : 'fixed';
  const value = Number(payload.value ?? existing?.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError('Promo discount value must be greater than zero', 400, 'VALIDATION_ERROR');
  }
  if (type === 'percentage' && value > 100) {
    throw new AppError('Percentage discount cannot exceed 100%', 400, 'VALIDATION_ERROR');
  }

  const minSubtotal = Math.max(0, Number(payload.minSubtotal ?? existing?.minSubtotal ?? 0) || 0);
  const rawExp = payload.expiresAt !== undefined ? payload.expiresAt : existing?.expiresAt;
  const expiresAt = rawExp ? String(rawExp).trim() : null;
  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    throw new AppError('Invalid expiration date format', 400, 'VALIDATION_ERROR');
  }

  const description = String(payload.description ?? existing?.description ?? '').trim().slice(0, 200);
  const active = payload.active !== undefined ? Boolean(payload.active) : existing?.active !== false;

  return {
    code,
    type,
    value: Math.round(value * 100) / 100,
    minSubtotal: Math.round(minSubtotal * 100) / 100,
    expiresAt,
    description,
    active,
  };
}

export async function listPromoCodes() {
  const firestore = ensureDb();
  const snap = await firestore.collection('promoCodes').get();
  const items = snap.docs.map((doc) => ({ code: doc.id, ...doc.data() }));
  items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return items;
}

export async function listPublicPromoCodes() {
  const all = await listPromoCodes();
  const now = Date.now();
  return all
    .filter((p) => {
      if (p.active === false) return false;
      if (p.expiresAt && new Date(p.expiresAt).getTime() < now) return false;
      return true;
    })
    .map((p) => ({
      code: p.code,
      type: p.type === 'percentage' ? 'percentage' : 'fixed',
      value: Number(p.value) || 0,
      minSubtotal: Number(p.minSubtotal) || 0,
      expiresAt: p.expiresAt || null,
      description: p.description || '',
    }));
}

export async function createPromoCode(payload = {}) {
  const firestore = ensureDb();
  const normalized = normalizePromoPayload(payload);
  const docRef = firestore.collection('promoCodes').doc(normalized.code);
  const existing = await docRef.get();
  if (existing.exists) {
    throw new AppError(`Promo code "${normalized.code}" already exists`, 409, 'PROMO_EXISTS');
  }

  const nowIso = new Date().toISOString();
  const docData = {
    ...normalized,
    createdAt: nowIso,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await docRef.set(docData);
  return { ...docData, updatedAt: nowIso };
}

export async function updatePromoCode(codeParam, payload = {}) {
  const firestore = ensureDb();
  const cleanCode = String(codeParam || '').trim().toUpperCase();
  const docRef = firestore.collection('promoCodes').doc(cleanCode);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new AppError(`Promo code not found: ${cleanCode}`, 404, 'PROMO_NOT_FOUND');
  }

  const existing = { code: snap.id, ...snap.data() };
  const normalized = normalizePromoPayload({ ...payload, code: cleanCode }, existing);
  await docRef.set(
    {
      ...normalized,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  const refreshed = await docRef.get();
  return { code: refreshed.id, ...refreshed.data() };
}

export async function deletePromoCode(codeParam) {
  const firestore = ensureDb();
  const cleanCode = String(codeParam || '').trim().toUpperCase();
  const docRef = firestore.collection('promoCodes').doc(cleanCode);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new AppError(`Promo code not found: ${cleanCode}`, 404, 'PROMO_NOT_FOUND');
  }
  await docRef.delete();
  return { deletedCode: cleanCode };
}


