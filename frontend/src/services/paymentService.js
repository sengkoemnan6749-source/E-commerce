import { api } from './api';

export const KHQR_AUTOVERIFY_BASE_URL = 'https://khqr-aba-autoverify.vercel.app';

export const paymentService = {
  async processCardPayment() {
    throw new Error('Card payment is disabled. Please pay via Bakong KHQR.');
  },

  /**
   * Generates a KHQR payment session via backend + https://khqr-aba-autoverify.vercel.app/api/generate-khqr
   */
  async initiateKHQRPayment(amount, currency = 'USD', { items = null, promoCode = null } = {}) {
    const normalizedCurrency = String(currency || 'USD').toUpperCase() === 'KHR' ? 'KHR' : 'USD';
    const normalizedAmount =
      normalizedCurrency === 'KHR' ? Math.max(1, Math.round(Number(amount || 0))) : Number(Number(amount || 0).toFixed(2));

    let backendSession = null;
    try {
      const res = await api.post('/payments/khqr', {
        amount: normalizedAmount,
        currency: normalizedCurrency,
        ...(Array.isArray(items) && items.length > 0 ? { items } : {}),
        ...(promoCode ? { promoCode } : {}),
      });
      if (res?.data) {
        backendSession = res.data;
      }
    } catch (err) {
      // If backend call fails for a validation/auth reason, rethrow unless gateway direct fallback is needed
      if (err?.status === 401 || err?.status === 400) {
        throw err;
      }
    }

    // If backend already returned a full session with txToken from khqr-aba-autoverify.vercel.app, return it directly
    if (backendSession?.qrDataUrl && backendSession?.txToken && (backendSession?.md5 || backendSession?.md5Hash)) {
      return {
        ...backendSession,
        md5: backendSession.md5 || backendSession.md5Hash,
        md5Hash: backendSession.md5Hash || backendSession.md5,
        qr: backendSession.qr || backendSession.khqrString,
        khqrString: backendSession.khqrString || backendSession.qr,
      };
    }

    // Otherwise call POST https://khqr-aba-autoverify.vercel.app/api/generate-khqr directly to ensure txToken & qrDataUrl
    const billNumber = backendSession?.billNumber || `ORDER-${Date.now().toString().slice(-6)}`;
    const gwRes = await fetch(`${KHQR_AUTOVERIFY_BASE_URL}/api/generate-khqr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        bakongAccountId: backendSession?.bakongAccountId || 'seng_koemnan@bkrt',
        merchantName: 'TechTonic Store',
        merchantCity: 'Phnom Penh',
        amount: backendSession?.amount ?? normalizedAmount,
        currency: backendSession?.currency || normalizedCurrency,
        billNumber,
      }),
    });

    const gwJson = await gwRes.json().catch(() => null);
    const gwData = gwJson?.data || gwJson;
    if (!gwRes.ok || !gwData?.qrDataUrl || !gwData?.md5) {
      if (backendSession?.qrDataUrl) {
        return backendSession;
      }
      throw new Error(gwJson?.error || 'Failed to generate Bakong KHQR code.');
    }

    const expiresAtIso = gwData.expiresAt
      ? new Date(Number(gwData.expiresAt) || gwData.expiresAt).toISOString()
      : new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return {
      ...(backendSession || {}),
      transactionId: backendSession?.transactionId || `KHQR-${Date.now()}`,
      md5: gwData.md5,
      md5Hash: gwData.md5,
      txToken: gwData.txToken,
      qrDataUrl: gwData.qrDataUrl,
      qr: gwData.qr,
      khqrString: gwData.qr,
      billNumber: gwData.billNumber || billNumber,
      bakongAccountId: gwData.bakongAccountId || 'seng_koemnan@bkrt',
      merchantName: 'TechTonic Store',
      amount: gwData.amount ?? normalizedAmount,
      currency: gwData.currency || normalizedCurrency,
      expiresAt: expiresAtIso,
      liveVerificationEnabled: true,
    };
  },

  /**
   * Direct poll against POST https://khqr-aba-autoverify.vercel.app/api/check-payment
   */
  async checkPaymentOnGateway(md5, txToken) {
    if (!md5) return { status: 'PENDING' };
    const res = await fetch(`${KHQR_AUTOVERIFY_BASE_URL}/api/check-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        md5,
        ...(txToken ? { txToken } : {}),
      }),
    });
    const json = await res.json().catch(() => null);
    return json || { status: 'PENDING' };
  },

  /**
   * Verifies KHQR payment via POST https://khqr-aba-autoverify.vercel.app/api/check-payment
   * and syncs PAID settlement into our backend database (/payments/khqr/verify).
   */
  async verifyKHQRPayment(
    md5HashOrTxId,
    { md5 = null, txToken = null, mode = 'manual', customerName, customerPhone, payerAccountName } = {}
  ) {
    const target = String(md5HashOrTxId || md5 || '').trim();
    if (!target || target === 'mock_khqr_hash') {
      throw new Error('Invalid KHQR payment session. Please generate a new QR code.');
    }

    const effectiveMd5 = String(md5 || (!target.startsWith('KHQR-') ? target : '')).trim();

    // 1. Check Zero-Token Official NBC Bakong Gateway on https://khqr-aba-autoverify.vercel.app/api/check-payment
    let gatewayCheck = null;
    if (effectiveMd5 && mode !== 'telegram_request') {
      try {
        gatewayCheck = await this.checkPaymentOnGateway(effectiveMd5, txToken);
      } catch {
        // Proceed to backend verification endpoint
      }
    }

    // 2. Sync with backend database (/api/payments/khqr/verify)
    const payload = {
      ...(target.startsWith('KHQR-') ? { transactionId: target } : { md5Hash: target }),
      ...(effectiveMd5 ? { md5: effectiveMd5, md5Hash: effectiveMd5 } : {}),
      ...(txToken ? { txToken } : {}),
      mode,
      ...(customerName ? { customerName } : {}),
      ...(customerPhone ? { customerPhone } : {}),
      ...(payerAccountName ? { payerAccountName } : {}),
    };

    try {
      const res = await api.post('/payments/khqr/verify', payload);
      if (res?.data) {
        if (res.data.status === 'PAID' || gatewayCheck?.status !== 'PAID') {
          return res.data;
        }
      }
    } catch (backendErr) {
      if (gatewayCheck?.status !== 'PAID') {
        throw backendErr;
      }
    }

    if (gatewayCheck?.status === 'PAID') {
      const tx = gatewayCheck.transaction || {};
      const details = tx.paymentDetails || {};
      return {
        success: true,
        status: 'PAID',
        source: gatewayCheck.source || 'BAKONG_OFFICIAL_GATEWAY_ZERO_TOKEN',
        verifiedBy: 'bakong_api',
        transactionId: target,
        md5Hash: effectiveMd5 || tx.md5,
        amount: tx.amount,
        currency: tx.currency,
        payerAccountName:
          details.fromAccountName ||
          details.payerName ||
          details.fromAccountId ||
          payerAccountName ||
          'ABA / Bakong User',
        paidAt: tx.paidAt ? new Date(tx.paidAt).toISOString() : new Date().toISOString(),
        transaction: tx,
      };
    }

    return { status: gatewayCheck?.status || 'PENDING' };
  },
};
