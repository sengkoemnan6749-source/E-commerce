import * as orderService from '../services/orderService.js';
import * as paymentService from '../services/paymentService.js';
import * as promoService from '../services/promoService.js';
import { recordAuditEvent } from '../services/auditService.js';
import { notifyNewOrder } from '../services/telegramService.js';

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
    const order = await orderService.createOrder(req.body, req.user);
    recordAuditEvent(req, {
      eventType: 'ORDER_CREATED',
      severity: 'info',
      targetType: 'order',
      targetId: order?.id || order?.orderNumber || null,
      status: 'SUCCESS',
      details: `Order placed via ${order?.paymentMethod || 'unknown'} ($${Number(order?.total || 0).toFixed(2)})`,
    });
    notifyNewOrder(order).catch(() => {});
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
    const receipt = await paymentService.verifyKhqrPayment(req.body);
    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
}

export async function processCardPayment(req, res, next) {
  try {
    const receipt = await paymentService.processCardPayment(req.body, req.user);
    recordAuditEvent(req, {
      eventType: 'PAYMENT_CARD_PROCESSED',
      severity: 'info',
      targetType: 'payment',
      targetId: receipt?.transactionId || req.body?.orderId || null,
      status: 'SUCCESS',
      details: `Card payment processed ($${Number(receipt?.amount || req.body?.amount || 0).toFixed(2)})`,
    });
    res.status(201).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
}

