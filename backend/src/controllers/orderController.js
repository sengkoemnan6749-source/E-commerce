import * as orderService from '../services/orderService.js';
import * as paymentService from '../services/paymentService.js';
import * as promoService from '../services/promoService.js';
import { recordAuditEvent } from '../services/auditService.js';
import { reportPaymentSecurityIncident, timingSafeTokenEqual } from '../services/paymentSecurity.js';
import { notifyNewOrder, processTelegramPaymentWebhook } from '../services/telegramService.js';

export async function getActivePromos(_req, res, next) {
  try {
    const promos = await promoService.listPublicPromoCodes();
    res.json({
      success: true,
      count: promos.length,
      data: promos,
    });
  } catch (error) {
    next(error);
  }
}

export async function validatePromo(req, res, next) {
  try {
    const { code, subtotal } = req.body || {};
    const result = await promoService.validatePromoCode(code, subtotal);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.body, req.user, req);
    const sideEffects = Promise.allSettled([
      recordAuditEvent(req, {
        eventType: 'ORDER_CREATED',
        severity: 'info',
        targetType: 'order',
        targetId: order?.id || order?.orderNumber || null,
        status: 'SUCCESS',
        details: `Order placed via ${order?.paymentMethod || 'unknown'} ($${Number(order?.total || 0).toFixed(2)})`,
      }),
      notifyNewOrder(order),
    ]);
    if (process.env.VERCEL === '1') {
      await Promise.race([sideEffects, new Promise((r) => setTimeout(r, 3500))]);
    }
    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await orderService.listUserOrders(req.user);
    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user, req.query);
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function createKhqrPayment(req, res, next) {
  try {
    const payment = await paymentService.initiateKhqrPayment(req.body, req.user);
    recordAuditEvent(req, {
      eventType: 'PAYMENT_KHQR_INITIATED',
      severity: 'info',
      targetType: 'payment',
      targetId: payment?.transactionId || req.body?.orderId || null,
      status: 'SUCCESS',
      details: `KHQR payment initiated ($${Number(payment?.amount || req.body?.amount || 0).toFixed(2)})`,
    });
    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyKhqrPayment(req, res, next) {
  try {
    const receipt = await paymentService.verifyKhqrPayment(req.body, req.user, req);
    if (receipt?.status === 'PAID') {
      recordAuditEvent(req, {
        eventType: 'PAYMENT_KHQR_VERIFIED',
        severity: 'info',
        targetType: 'payment',
        targetId: receipt.transactionId || req.body?.transactionId || req.body?.md5Hash || null,
        status: 'SUCCESS',
        details: `KHQR payment verified via ${receipt.verifiedBy || 'api'} ($${Number(receipt.amount || 0).toFixed(2)})`,
      });
    }
    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
}

export async function telegramPaymentWebhook(req, res) {
  const expectedSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  const providedSecret = String(req.headers['x-telegram-bot-api-secret-token'] || '').trim();

  if (!expectedSecret || !timingSafeTokenEqual(providedSecret, expectedSecret)) {
    await reportPaymentSecurityIncident(req, {
      reason: 'TELEGRAM_WEBHOOK_SPOOF_BLOCKED',
      severity: 'critical',
      details: 'Rejected unverified POST to /payments/khqr/telegram-webhook (invalid or missing secret token)',
    });
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  try {
    await processTelegramPaymentWebhook(req.body);
  } catch {
    // Always acknowledge Telegram webhook cleanly once verified
  }
  return res.json({ ok: true });
}

export async function processCardPayment(req, res, next) {
  try {
    const receipt = await paymentService.processCardPayment(req.body, req.user, req);
    res.status(201).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
}

