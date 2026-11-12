import { INITIAL_ORDERS } from './mockData';

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
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
}

function saveStoredOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders:', e);
  }
}

function normalizeOrder(o) {
  if (!o) return null;
  const address = o.shippingAddress || {
    fullName: o.customerName || o.customer?.fullName || 'Sara Meng',
    phone: o.customerPhone || o.customer?.phone || '012 888 999',
    address: 'Street 310, Building 24, BKK1',
    city: 'Phnom Penh',
    province: 'Phnom Penh',
    postalCode: '120101'
  };

  return {
    ...o,
    id: o.id || `#ORD-20260924-${Math.floor(1000 + Math.random() * 9000)}`,
    status: o.status || 'Confirmed',
    customerName: o.customerName || address.fullName,
    customerPhone: o.customerPhone || address.phone,
    customerEmail: o.customerEmail || 'customer@techtonic.store',
    shippingAddress: address,
    items: o.items || [],
    paymentMethod: o.paymentMethod || 'KHQR (Bakong / ABA)',
    paymentStatus: o.paymentStatus || 'PAID',
    carrier: o.carrier || 'GrabExpress Phnom Penh',
    estimatedDelivery: o.estimatedDelivery || 'Today by 5:30 PM',
    createdAt: o.createdAt || new Date().toISOString()
  };
}

export const orderService = {
  getOrders() {
    return getStoredOrders().map(normalizeOrder);
  },

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => String(o.id) === String(id) || o.id === `#${id}`) || null;
  },

  createOrder(orderPayload) {
    const orders = getStoredOrders();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderId = `#ORD-${todayStr}-${randomHex}`;

    const newOrder = {
      id: orderId,
      userId: orderPayload.userId || null,
      createdAt: new Date().toISOString(),
      status: orderPayload.status || 'confirmed',
      customerName: orderPayload.customerName || orderPayload.shippingAddress?.fullName || 'Customer',
      customerPhone: orderPayload.customerPhone || orderPayload.shippingAddress?.phone || '012 345 678',
      customerEmail: orderPayload.customerEmail || 'customer@techtonic.store',
      shippingAddress: orderPayload.shippingAddress,
      paymentMethod: orderPayload.paymentMethod || 'KHQR Bakong',
      paymentStatus: 'PAID',
      transactionId: orderPayload.transactionId || 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
      items: orderPayload.items || [],
      subtotal: orderPayload.subtotal || 0,
      shippingFee: orderPayload.shippingFee || 0,
      discountAmount: orderPayload.discountAmount || 0,
      total: orderPayload.total || 0,
      appliedCoupon: orderPayload.appliedCoupon || null,
      carrier: orderPayload.carrier || 'GrabExpress Dispatch',
      estimatedDelivery: orderPayload.estimatedDelivery || 'Today by 5:30 PM'
    };

    orders.unshift(newOrder);
    saveStoredOrders(orders);
    return normalizeOrder(newOrder);
  },

  updateOrderStatus(orderId, newStatus) {
    const orders = getStoredOrders();
    const order = orders.find(o => String(o.id) === String(orderId) || o.id === `#${orderId}`);
    if (order) {
      order.status = newStatus;
      saveStoredOrders(orders);
      return normalizeOrder(order);
    }
    return null;
  }
};
