import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

export const DEFAULT_SHIPPING_CONFIG = {
  freeShippingThreshold: 0,
  partners: [
    {
      id: 'vireak_buntham',
      name: 'Vireak Buntham Express (VET)',
      khmerName: 'វីរៈ ប៊ុនថាំ អេចប្រេស',
      badge: 'All 25 Provinces',
      badgeKm: '២៥ រាជធានី-ខេត្ត',
      eta: '1 - 2 Business Days',
      etaKm: '១ - ២ ថ្ងៃធ្វើការ',
      fee: 1.75,
      enabled: true,
      website: 'https://vireakbuntham.com/',
    },
    {
      id: 'jt_express',
      name: 'J&T Express Cambodia',
      khmerName: 'ជេ&ធី អេចប្រេស',
      badge: 'Door-to-Door Delivery',
      badgeKm: 'ដឹកជញ្ជូនដល់មុខផ្ទះ',
      eta: '1 - 2 Business Days',
      etaKm: '១ - ២ ថ្ងៃធ្វើការ',
      fee: 2.0,
      enabled: true,
      website: 'https://www.jtexpresskh.com/',
    },
    {
      id: 'grab_express',
      name: 'GrabExpress Phnom Penh',
      khmerName: 'ហ្គ្រែប អេចប្រេស',
      badge: 'Same-Day Fast (1-3 hrs)',
      badgeKm: 'រហ័សក្នុងថ្ងៃតែមួយ (១-៣ ម៉ោង)',
      eta: 'Today (Within 3 Hours)',
      etaKm: 'ថ្ងៃនេះ (ក្នុងរយៈពេល ៣ ម៉ោង)',
      fee: 2.5,
      enabled: true,
      website: 'https://www.grab.com/kh/express/',
    },
  ],
};

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function cleanText(value, fallback, maxLen = 80) {
  const cleaned = String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
  return cleaned || fallback;
}

export function normalizeShippingConfig(raw = null) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const rawThreshold = Number(source.freeShippingThreshold);
  const freeShippingThreshold =
    Number.isFinite(rawThreshold) && rawThreshold >= 0
      ? roundCurrency(Math.min(rawThreshold, 100000))
      : DEFAULT_SHIPPING_CONFIG.freeShippingThreshold;

  const incomingList = Array.isArray(source.partners) ? source.partners : [];
  const byId = new Map(
    incomingList
      .filter((p) => p && typeof p.id === 'string')
      .map((p) => [p.id.trim().toLowerCase(), p])
  );

  const partners = DEFAULT_SHIPPING_CONFIG.partners.map((def) => {
    const ov = byId.get(def.id) || {};
    const parsedFee = Number(ov.fee);
    const fee =
      Number.isFinite(parsedFee) && parsedFee >= 0 && parsedFee <= 500
        ? roundCurrency(parsedFee)
        : def.fee;

    return {
      ...def,
      fee,
      enabled: typeof ov.enabled === 'boolean' ? ov.enabled : def.enabled,
      eta: cleanText(ov.eta, def.eta, 80),
      etaKm: cleanText(ov.etaKm, def.etaKm, 80),
      badge: cleanText(ov.badge, def.badge, 80),
      badgeKm: cleanText(ov.badgeKm, def.badgeKm, 80),
    };
  });

  if (!partners.some((p) => p.enabled !== false)) {
    partners[0].enabled = true;
  }

  return {
    freeShippingThreshold,
    partners,
  };
}

export async function getShippingConfig(firestore = db, tx = null) {
  if (!firestore) {
    return normalizeShippingConfig(null);
  }
  const ref = firestore.collection('settings').doc('shipping');
  const snap = tx ? await tx.get(ref) : await ref.get();
  return normalizeShippingConfig(snap.exists ? snap.data() : null);
}

export async function updateShippingConfig(payload = {}) {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }

  const rawThreshold =
    payload.freeShippingThreshold === undefined || payload.freeShippingThreshold === ''
      ? 0
      : Number(payload.freeShippingThreshold);
  if (!Number.isFinite(rawThreshold) || rawThreshold < 0 || rawThreshold > 100000) {
    throw new AppError(
      'Free shipping threshold must be a number between 0 and 100000',
      400,
      'VALIDATION_ERROR'
    );
  }
  const freeShippingThreshold = roundCurrency(rawThreshold);

  const incomingList = Array.isArray(payload.partners) ? payload.partners : [];
  if (incomingList.length === 0) {
    throw new AppError('Shipping partners list is required', 400, 'VALIDATION_ERROR');
  }

  const incomingById = new Map(
    incomingList
      .filter((p) => p && typeof p.id === 'string')
      .map((p) => [p.id.trim().toLowerCase(), p])
  );

  const existing = await getShippingConfig(db);
  const existingById = new Map(existing.partners.map((p) => [p.id, p]));

  const partners = DEFAULT_SHIPPING_CONFIG.partners.map((def) => {
    const prev = existingById.get(def.id) || def;
    const ov = incomingById.get(def.id);
    if (!ov) return prev;

    const feeNum = Number(ov.fee);
    if (!Number.isFinite(feeNum) || feeNum < 0 || feeNum > 500) {
      throw new AppError(
        `Shipping fee for ${def.name} must be between $0.00 and $500.00`,
        400,
        'VALIDATION_ERROR'
      );
    }

    return {
      ...def,
      fee: roundCurrency(feeNum),
      enabled: typeof ov.enabled === 'boolean' ? ov.enabled : prev.enabled,
      eta: cleanText(ov.eta, prev.eta, 80),
      etaKm: cleanText(ov.etaKm, prev.etaKm, 80),
      badge: cleanText(ov.badge, prev.badge, 80),
      badgeKm: cleanText(ov.badgeKm, prev.badgeKm, 80),
    };
  });

  if (!partners.some((p) => p.enabled !== false)) {
    throw new AppError(
      'At least one delivery partner must remain enabled',
      400,
      'VALIDATION_ERROR'
    );
  }

  await db
    .collection('settings')
    .doc('shipping')
    .set(
      {
        freeShippingThreshold,
        partners,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return normalizeShippingConfig({ freeShippingThreshold, partners });
}

export function resolveShippingFee(config, deliveryPartnerId = null, subtotal = 0) {
  const normalized = normalizeShippingConfig(config);
  const enabledPartners = normalized.partners.filter((p) => p.enabled !== false);
  const requestedId = String(deliveryPartnerId || '').trim().toLowerCase();

  const partner =
    enabledPartners.find((p) => p.id.toLowerCase() === requestedId) ||
    enabledPartners[0] ||
    normalized.partners[0];

  const numericSubtotal = Number(subtotal || 0);
  const freeShippingApplied =
    normalized.freeShippingThreshold > 0 && numericSubtotal >= normalized.freeShippingThreshold;

  const shippingFee = freeShippingApplied ? 0 : roundCurrency(partner?.fee || 0);

  return {
    partner,
    shippingFee,
    freeShippingApplied,
  };
}
