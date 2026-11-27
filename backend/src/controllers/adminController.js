import * as adminService from '../services/adminService.js';
import * as promoService from '../services/promoService.js';
import * as shippingService from '../services/shippingService.js';
import { recordAuditEvent, listAuditLogs } from '../services/auditService.js';

export async function getDashboard(_req, res, next) {
  try {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await adminService.createProduct(req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_PRODUCT_CREATED',
      severity: 'info',
      targetType: 'product',
      targetId: product?.id || null,
      status: 'SUCCESS',
      details: `Created product "${product?.name || ''}"`,
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await adminService.updateProduct(req.params.id, req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_PRODUCT_UPDATED',
      severity: 'info',
      targetType: 'product',
      targetId: req.params.id,
      status: 'SUCCESS',
      details: `Updated product "${product?.name || req.params.id}"`,
    });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const result = await adminService.deleteProduct(req.params.id);
    recordAuditEvent(req, {
      eventType: 'ADMIN_PRODUCT_DELETED',
      severity: 'warning',
      targetType: 'product',
      targetId: req.params.id,
      status: 'SUCCESS',
      details: `Deleted product ${req.params.id}`,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await adminService.createCategory(req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_CATEGORY_CREATED',
      severity: 'info',
      targetType: 'category',
      targetId: category?.id || null,
      status: 'SUCCESS',
      details: `Created category "${category?.name || ''}"`,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await adminService.updateCategory(req.params.id, req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_CATEGORY_UPDATED',
      severity: 'info',
      targetType: 'category',
      targetId: req.params.id,
      status: 'SUCCESS',
      details: `Updated category "${category?.name || req.params.id}"`,
    });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const result = await adminService.deleteCategory(req.params.id);
    recordAuditEvent(req, {
      eventType: 'ADMIN_CATEGORY_DELETED',
      severity: 'warning',
      targetType: 'category',
      targetId: req.params.id,
      status: 'SUCCESS',
      details: `Deleted category ${req.params.id}`,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getOrders(req, res, next) {
  try {
    const result = await adminService.listAllOrders(req.query);
    res.json({
      success: true,
      count: result.orders.length,
      statusCounts: result.statusCounts,
      pagination: result.pagination,
      data: result.orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const order = await adminService.updateOrderStatus(req.params.id, req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_ORDER_STATUS_UPDATED',
      severity: 'info',
      targetType: 'order',
      targetId: req.params.id,
      status: 'SUCCESS',
      details: `Updated order ${req.params.id} status to "${req.body?.status || order?.status || ''}"`,
    });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function getCustomers(req, res, next) {
  try {
    const customers = await adminService.listAllCustomers(req.query);
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomerRole(req, res, next) {
  try {
    const updated = await adminService.updateUserRole(req.params.id, req.body, req.user);
    recordAuditEvent(req, {
      eventType: 'ADMIN_USER_ROLE_UPDATED',
      severity: 'warning',
      targetType: 'user',
      targetId: updated.id,
      status: 'SUCCESS',
      details: `Changed role for "${updated.email || updated.id}" from ${updated.previousRole} to ${updated.role}`,
    });
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const result = await listAuditLogs(req.query);
    res.json({
      success: true,
      count: result.logs.length,
      summary: result.summary,
      data: result.logs,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPromoCodes(_req, res, next) {
  try {
    const promos = await promoService.listPromoCodes();
    res.json({ success: true, count: promos.length, data: promos });
  } catch (error) {
    next(error);
  }
}

export async function createPromoCode(req, res, next) {
  try {
    const promo = await promoService.createPromoCode(req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_PROMO_CREATED',
      severity: 'info',
      targetType: 'promo',
      targetId: promo.code,
      status: 'SUCCESS',
      details: `Created promo code "${promo.code}"`,
    });
    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    next(error);
  }
}

export async function updatePromoCode(req, res, next) {
  try {
    const promo = await promoService.updatePromoCode(req.params.code, req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_PROMO_UPDATED',
      severity: 'info',
      targetType: 'promo',
      targetId: promo.code,
      status: 'SUCCESS',
      details: `Updated promo code "${promo.code}"`,
    });
    res.json({ success: true, data: promo });
  } catch (error) {
    next(error);
  }
}

export async function deletePromoCode(req, res, next) {
  try {
    const result = await promoService.deletePromoCode(req.params.code);
    recordAuditEvent(req, {
      eventType: 'ADMIN_PROMO_DELETED',
      severity: 'warning',
      targetType: 'promo',
      targetId: result.deletedCode,
      status: 'SUCCESS',
      details: `Deleted promo code "${result.deletedCode}"`,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getShippingRates(_req, res, next) {
  try {
    const config = await shippingService.getShippingConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function updateShippingRates(req, res, next) {
  try {
    const updated = await shippingService.updateShippingConfig(req.body);
    recordAuditEvent(req, {
      eventType: 'ADMIN_SHIPPING_RATES_UPDATED',
      severity: 'info',
      targetType: 'settings',
      targetId: 'shipping',
      status: 'SUCCESS',
      details: `Updated shipping rates (threshold=$${updated.freeShippingThreshold}, partners=${updated.partners
        .map((p) => `${p.id}:$${p.fee}${p.enabled ? '' : '[off]'}`)
        .join(', ')})`,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

