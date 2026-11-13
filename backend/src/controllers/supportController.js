import * as supportService from '../services/supportService.js';
import * as telegramService from '../services/telegramService.js';
import * as newsletterService from '../services/newsletterService.js';

export async function subscribeNewsletter(req, res, next) {
  try {
    const data = await newsletterService.subscribeNewsletter(req.body, req.user);
    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitSupportTicket(req, res, next) {
  try {
    const ticket = await supportService.createSupportTicket(req, req.body);
    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminSupportTickets(req, res, next) {
  try {
    const data = await supportService.listSupportTickets({
      status: req.query.status,
      limit: req.query.limit,
    });
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function patchAdminSupportTicket(req, res, next) {
  try {
    const updated = await supportService.updateSupportTicketStatus(req, req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTelegramStatus(_req, res, next) {
  try {
    const data = await telegramService.getTelegramStatus();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function connectTelegramBot(req, res, next) {
  try {
    const data = await telegramService.connectTelegramAdmin(req);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function testTelegramBot(_req, res, next) {
  try {
    const data = await telegramService.sendTelegramTestAlert('support');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getOrderTelegramStatus(_req, res, next) {
  try {
    const data = await telegramService.getTelegramStatus('orders');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function configureOrderTelegramBot(req, res, next) {
  try {
    const data = await telegramService.configureTelegramBotToken(req, req.body?.botToken, 'orders');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function connectOrderTelegramBot(req, res, next) {
  try {
    const data = await telegramService.connectTelegramAdmin(req, 'orders');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function testOrderTelegramBot(_req, res, next) {
  try {
    const data = await telegramService.sendTelegramTestAlert('orders');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

