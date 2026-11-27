import { api } from './api';
import { shippingService } from './shippingService';

export const adminService = {
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res?.data || null;
  },

  async getOrders({ status = 'All', search = '', page = 1, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(page));
    params.set('limit', String(limit));
    const res = await api.get(`/admin/orders?${params.toString()}`);
    return {
      orders: Array.isArray(res?.data) ? res.data : [],
      statusCounts: res?.statusCounts || {},
      count: res?.count || 0,
    };
  },

  async updateOrderStatus(orderId, payload) {
    const cleanId = String(orderId).replace(/^#/, '').trim();
    const body = typeof payload === 'string' ? { status: payload } : payload;
    const res = await api.patch(`/admin/orders/${encodeURIComponent(cleanId)}/status`, body);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techtonic:admin-updated'));
      const pingPayload = {
        orderId: cleanId,
        status: res?.data?.status || body?.status || null,
        ts: Date.now(),
      };
      try {
        localStorage.setItem('techtonic_order_sync_ping', JSON.stringify(pingPayload));
      } catch {
        // Ignore storage errors
      }
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('techtonic-order-sync');
          channel.postMessage(pingPayload);
          channel.close();
        } catch {
          // Ignore BroadcastChannel errors
        }
      }
    }
    return res?.data || null;
  },

  async getCustomers(search = '') {
    const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const res = await api.get(`/admin/customers${qs}`);
    return Array.isArray(res?.data) ? res.data : [];
  },

  async updateCustomerRole(userId, role) {
    const res = await api.patch(`/admin/customers/${encodeURIComponent(userId)}/role`, { role });
    return res?.data || null;
  },

  async getPromos() {
    const res = await api.get('/admin/promos');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async createPromo(payload) {
    const res = await api.post('/admin/promos', payload);
    return res?.data || null;
  },

  async updatePromo(code, payload) {
    const res = await api.patch(`/admin/promos/${encodeURIComponent(code)}`, payload);
    return res?.data || null;
  },

  async deletePromo(code) {
    const res = await api.delete(`/admin/promos/${encodeURIComponent(code)}`);
    return res?.data || null;
  },

  async getShippingRates() {
    const res = await api.get('/admin/shipping-rates');
    return res?.data || null;
  },

  async updateShippingRates(payload) {
    const res = await api.put('/admin/shipping-rates', payload);
    if (res?.data) {
      shippingService.saveCachedShippingConfig(res.data);
    }
    return res?.data || null;
  },

  async createProduct(productData) {
    const res = await api.post('/admin/products', productData);
    return res?.data || null;
  },

  async updateProduct(id, productData) {
    const res = await api.put(`/admin/products/${encodeURIComponent(id)}`, productData);
    return res?.data || null;
  },

  async deleteProduct(id) {
    const res = await api.delete(`/admin/products/${encodeURIComponent(id)}`);
    return res?.data || null;
  },

  async createCategory(catData) {
    const res = await api.post('/admin/categories', catData);
    return res?.data || null;
  },

  async updateCategory(id, catData) {
    const res = await api.put(`/admin/categories/${encodeURIComponent(id)}`, catData);
    return res?.data || null;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/admin/categories/${encodeURIComponent(id)}`);
    return res?.data || null;
  },

  async getAuditLogs({ severity = 'all', eventType = 'all', search = '', limit = 150 } = {}) {
    const params = new URLSearchParams();
    if (severity && severity !== 'all') params.set('severity', severity);
    if (eventType && eventType !== 'all') params.set('eventType', eventType);
    if (search.trim()) params.set('search', search.trim());
    params.set('limit', String(limit));
    const res = await api.get(`/admin/audit-logs?${params.toString()}`);
    return {
      logs: Array.isArray(res?.data) ? res.data : [],
      summary: res?.summary || { total: 0, criticalCount: 0, warningCount: 0, blockedCount: 0 },
      count: res?.count || 0,
    };
  },

  async getSupportTickets({ status = '', limit = 150 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    params.set('limit', String(limit));
    const res = await api.get(`/admin/support-tickets?${params.toString()}`);
    return res?.data || { items: [], openCount: 0, total: 0 };
  },

  async updateSupportTicket(id, payload) {
    const res = await api.patch(`/admin/support-tickets/${encodeURIComponent(id)}`, payload);
    return res?.data || null;
  },

  async getTelegramStatus() {
    const res = await api.get('/admin/telegram/status');
    return res?.data || null;
  },

  async connectTelegramBot() {
    const res = await api.post('/admin/telegram/connect', {});
    return res?.data || null;
  },

  async testTelegramBot() {
    const res = await api.post('/admin/telegram/test', {});
    return res?.data || null;
  },

  async getOrderTelegramStatus() {
    const res = await api.get('/admin/telegram/orders/status');
    return res?.data || null;
  },

  async configureOrderTelegramBot(botToken) {
    const res = await api.post('/admin/telegram/orders/configure', { botToken });
    return res?.data || null;
  },

  async connectOrderTelegramBot() {
    const res = await api.post('/admin/telegram/orders/connect', {});
    return res?.data || null;
  },

  async testOrderTelegramBot() {
    const res = await api.post('/admin/telegram/orders/test', {});
    return res?.data || null;
  },

  async getVaultStatus() {
    const res = await api.get('/admin/vault/status');
    return res?.data || null;
  },

  async beginVaultSetup() {
    const res = await api.post('/admin/vault/setup/begin', {});
    return res?.data || null;
  },

  async confirmVaultSetup(pin, totpCode) {
    const res = await api.post('/admin/vault/setup/confirm', { pin, totpCode });
    if (res?.data?.vaultToken) {
      api.setAdminVaultToken(res.data.vaultToken);
    }
    return res?.data || null;
  },

  async unlockVault({ pin, totpCode, recoveryCode }) {
    const res = await api.post('/admin/vault/unlock', { pin, totpCode, recoveryCode });
    if (res?.data?.vaultToken) {
      api.setAdminVaultToken(res.data.vaultToken);
    }
    return res?.data || null;
  },

  async lockVault() {
    try {
      await api.post('/admin/vault/lock', {});
    } catch {
      // Clear local session regardless
    }
    api.setAdminVaultToken(null);
  },
};

