import { api } from './api';

const SHIPPING_CACHE_KEY = 'techtonic_shipping_config';

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
      eta: typeof ov.eta === 'string' && ov.eta.trim() ? ov.eta.trim() : def.eta,
      etaKm: typeof ov.etaKm === 'string' && ov.etaKm.trim() ? ov.etaKm.trim() : def.etaKm,
      badge: typeof ov.badge === 'string' && ov.badge.trim() ? ov.badge.trim() : def.badge,
      badgeKm: typeof ov.badgeKm === 'string' && ov.badgeKm.trim() ? ov.badgeKm.trim() : def.badgeKm,
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

export function getCachedShippingConfig() {
  try {
    const raw = localStorage.getItem(SHIPPING_CACHE_KEY);
    if (!raw) return normalizeShippingConfig(null);
    return normalizeShippingConfig(JSON.parse(raw));
  } catch {
    return normalizeShippingConfig(null);
  }
}

export function saveCachedShippingConfig(config) {
  const normalized = normalizeShippingConfig(config);
  try {
    localStorage.setItem(SHIPPING_CACHE_KEY, JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techtonic:shipping-updated', { detail: normalized }));
    }
  } catch {
    // Ignore storage errors
  }
  return normalized;
}

export function calculateShippingFee(config, partnerId = null, subtotal = 0) {
  const normalized = normalizeShippingConfig(config);
  const enabledPartners = normalized.partners.filter((p) => p.enabled !== false);
  const requested = String(partnerId || '').trim().toLowerCase();

  const partner =
    enabledPartners.find((p) => p.id.toLowerCase() === requested) ||
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

export const shippingService = {
  DEFAULT_SHIPPING_CONFIG,
  normalizeShippingConfig,
  getCachedShippingConfig,
  saveCachedShippingConfig,
  calculateShippingFee,

  async fetchShippingConfig() {
    try {
      const res = await api.get('/shipping-rates');
      if (res?.data) {
        return saveCachedShippingConfig(res.data);
      }
    } catch {
      // Fallback to cached or default config when offline
    }
    return getCachedShippingConfig();
  },
};
