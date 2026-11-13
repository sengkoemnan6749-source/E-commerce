import { api } from './api';

const ORDERS_KEY = 'techtonic_orders';

const ORDER_STATUS_LABELS = {
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  pending: 'Pending'
};

/**
 * Formats raw order status keys (e.g., 'confirmed', 'out_for_delivery') into consistent Title Case labels.
 */
export function formatOrderStatus(status = '') {
  const key = String(status).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (ORDER_STATUS_LABELS[key]) return ORDER_STATUS_LABELS[key];
  return String(status || 'Confirmed')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns formatted status label and subtle dot/text classes without pill background clutter.
 */
export function getOrderStatusMeta(status = '') {
  const label = formatOrderStatus(status);
  const s = label.toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) {
    return { label, dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
  }
  if (s.includes('out') || s.includes('transit') || s.includes('shipped')) {
    return { label, dotClass: 'bg-blue-500', textClass: 'text-blue-700' };
  }
  if (s.includes('cancel')) {
    return { label, dotClass: 'bg-rose-500', textClass: 'text-rose-700' };
  }
  return { label, dotClass: 'bg-amber-500', textClass: 'text-amber-700' };
}

function getStoredOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techtonic:orders-updated', { detail: orders }));
    }
  } catch (e) {
    console.error('Failed to save orders:', e);
  }
}

function normalizeOrder(o) {
  if (!o) return null;
  const address = o.shippingAddress || {
    fullName: o.customerName || o.customer?.fullName || 'Customer',
    phone: o.customerPhone || o.customer?.phone || '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  };

  return {
    ...o,
    id: o.id,
    status: o.status || 'Confirmed',
    customerName: o.customerName || address.fullName || 'Customer',
    customerPhone: o.customerPhone || address.phone || '',
    customerEmail: o.customerEmail || address.email || '',
    shippingAddress: address,
    items: o.items || [],
    paymentMethod: o.paymentMethod || 'KHQR (Bakong / ABA)',
    paymentStatus: o.paymentStatus || 'PAID',
    carrier: o.carrier || o.courier || 'GrabExpress Phnom Penh',
    estimatedDelivery: o.estimatedDelivery || 'Scheduled for dispatch',
    createdAt: o.createdAt || new Date().toISOString()
  };
}

export const orderService = {
  getOrders() {
    return getStoredOrders().map(normalizeOrder).filter(Boolean);
  },

  clearOrdersCache() {
    try {
      localStorage.removeItem(ORDERS_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techtonic:orders-updated', { detail: [] }));
      }
    } catch {
      // Ignore storage error
    }
  },

  getOrderById(id) {
    const orders = this.getOrders();
    const cleanTarget = String(id).replace(/^#/, '').trim();
    return orders.find(o => String(o.id).replace(/^#/, '') === cleanTarget) || null;
  },

  async createOrderAsync(orderPayload) {
    const res = await api.post('/orders', {
      items: orderPayload.items || [],
      promoCode: orderPayload.appliedCoupon || orderPayload.promoCode || null,
      paymentMethod: orderPayload.paymentMethod,
      paymentStatus: orderPayload.paymentStatus,
      transactionId: orderPayload.transactionId,
      courier: orderPayload.deliveryPartner,
      shippingAddress: {
        ...(orderPayload.shippingAddress || {}),
        fullName: orderPayload.customerName || orderPayload.shippingAddress?.fullName,
        phone: orderPayload.customerPhone || orderPayload.shippingAddress?.phone,
        email: orderPayload.customerEmail || orderPayload.shippingAddress?.email,
      },
    });

    if (!res?.data) {
      throw new Error('Server did not return a valid order record.');
    }

    const normalized = normalizeOrder(res.data);
    const orders = getStoredOrders().filter(o => o.id !== normalized.id);
    orders.unshift(normalized);
    saveStoredOrders(orders);
    return normalized;
  },

  async fetchMyOrders() {
    if (!api.getAuthToken()) {
      return this.getOrders();
    }
    const res = await api.get('/orders');
    if (Array.isArray(res?.data)) {
      const normalized = res.data.map(normalizeOrder).filter(Boolean);
      saveStoredOrders(normalized);
      return normalized;
    }
    return [];
  },

  async fetchOrderById(orderId, lookup = {}) {
    const cleanId = String(orderId || '').replace(/^#/, '').trim();
    if (!cleanId) return null;
    const params = new URLSearchParams();
    if (lookup.email) params.set('email', lookup.email);
    if (lookup.phone) params.set('phone', lookup.phone);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/orders/${encodeURIComponent(cleanId)}${qs}`);
    if (res?.data) {
      const normalized = normalizeOrder(res.data);
      const existing = getStoredOrders();
      const idx = existing.findIndex((o) => String(o.id).replace(/^#/, '') === normalized.id);
      if (idx >= 0) {
        const next = [...existing];
        next[idx] = normalized;
        saveStoredOrders(next);
      } else {
        saveStoredOrders([normalized, ...existing]);
      }
      return normalized;
    }
    return null;
  },
};
