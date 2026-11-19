import { api } from './api';

export const paymentService = {
  async processCardPayment() {
    throw new Error('Card payment is disabled. Please pay via Bakong KHQR.');
  },

  async initiateKHQRPayment(amount, currency = 'USD', { items = null, promoCode = null } = {}) {
    const res = await api.post('/payments/khqr', {
      amount,
      currency,
      ...(Array.isArray(items) && items.length > 0 ? { items } : {}),
      ...(promoCode ? { promoCode } : {}),
    });
    if (!res?.data?.qrDataUrl) {
      throw new Error('Failed to generate Bakong KHQR code from server.');
    }
    return res.data;
  },

  async verifyKHQRPayment(
    md5HashOrTxId,
    { mode = 'manual', customerName, customerPhone, payerAccountName } = {}
  ) {
    const target = String(md5HashOrTxId || '').trim();
    if (!target || target === 'mock_khqr_hash') {
      throw new Error('Invalid KHQR payment session. Please generate a new QR code.');
    }

    const payload = {
      ...(target.startsWith('KHQR-') ? { transactionId: target } : { md5Hash: target }),
      mode,
      ...(customerName ? { customerName } : {}),
      ...(customerPhone ? { customerPhone } : {}),
      ...(payerAccountName ? { payerAccountName } : {}),
    };

    const res = await api.post('/payments/khqr/verify', payload);
    if (res?.data) {
      return res.data;
    }

    throw new Error('Payment verification failed. Please retry.');
  },
};
