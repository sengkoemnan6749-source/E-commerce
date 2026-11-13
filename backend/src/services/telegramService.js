import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordAuditEvent } from './auditService.js';

const CHANNEL_CONFIG = {
  support: {
    docPath: 'adminSecurityConfig/telegram',
    tokenEnv: 'TELEGRAM_BOT_TOKEN',
    chatEnv: 'TELEGRAM_ADMIN_CHAT_ID',
    defaultBotUsername: 'techtonic_support_bot',
    connectedBanner:
      '✅ <b>TechTonic Support Bot Connected!</b>\nCustomer support inquiries will arrive here automatically.',
    testBanner:
      '🔔 <b>TechTonic Support Bot Test</b>\nSupport notifications are working properly.',
  },
  orders: {
    docPath: 'adminSecurityConfig/telegram_orders',
    tokenEnv: 'TELEGRAM_ORDER_BOT_TOKEN',
    chatEnv: 'TELEGRAM_ORDER_CHAT_ID',
    defaultBotUsername: 'techtonic_orders_bot',
    connectedBanner:
      '✅ <b>TechTonic Order Bot Connected!</b>\nNew customer orders will arrive here instantly.',
    testBanner:
      '🔔 <b>TechTonic Order Bot Test</b>\nOrder notifications are working properly.',
  },
};

function resolveChannelMeta(channel = 'support') {
  return CHANNEL_CONFIG[channel === 'orders' ? 'orders' : 'support'];
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function getStoredTelegramConfig(channel = 'support') {
  const meta = resolveChannelMeta(channel);
  let firestoreConfig = null;

  if (db) {
    try {
      const snap = await db.doc(meta.docPath).get();
      if (snap.exists) {
        firestoreConfig = snap.data() || null;
      }
    } catch {
      // ignore read failure
    }
  }

  const envToken = String(process.env[meta.tokenEnv] || '').trim();
  const botToken = envToken || String(firestoreConfig?.botToken || '').trim() || '';
  const envChatId = String(process.env[meta.chatEnv] || '').trim();
  const chatId = envChatId || String(firestoreConfig?.chatId || '').trim() || '';

  return {
    botToken,
    chatId,
    botUsername: firestoreConfig?.botUsername || meta.defaultBotUsername,
    chatUsername: firestoreConfig?.chatUsername || (envChatId ? '@techtonic_admin' : null),
    connectedAt: firestoreConfig?.connectedAt || null,
  };
}

async function telegramApiWithToken(token, method, payload = null) {
  if (!token) {
    throw new AppError('Telegram Bot Token is not configured.', 400, 'TELEGRAM_NOT_CONFIGURED');
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new AppError(
      json?.description || `Telegram API error (${res.status})`,
      502,
      'TELEGRAM_API_ERROR'
    );
  }
  return json.result;
}

export async function getTelegramStatus(channel = 'support') {
  const meta = resolveChannelMeta(channel);
  const stored = await getStoredTelegramConfig(channel);

  let botUsername = stored.botUsername || meta.defaultBotUsername;
  if (stored.botToken) {
    try {
      const me = await telegramApiWithToken(stored.botToken, 'getMe');
      if (me?.username) botUsername = me.username;
    } catch {
      // Fallback if offline
    }
  }

  return {
    channel: channel === 'orders' ? 'orders' : 'support',
    botConfigured: Boolean(stored.botToken),
    botUsername,
    connected: Boolean(stored.botToken && stored.chatId),
    chatUsername: stored.chatId ? stored.chatUsername : null,
    connectedAt: stored.connectedAt || null,
  };
}

/**
 * Validates and saves a dedicated Telegram Bot Token for the target channel (e.g. orders).
 */
export async function configureTelegramBotToken(req, rawToken, channel = 'orders') {
  const meta = resolveChannelMeta(channel);
  const token = String(rawToken || '').trim();

  if (!token || !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new AppError(
      'Invalid Telegram Bot Token format. Paste the HTTP API token from @BotFather.',
      400,
      'INVALID_TELEGRAM_TOKEN'
    );
  }

  const me = await telegramApiWithToken(token, 'getMe');
  const botUsername = me?.username || meta.defaultBotUsername;

  if (db) {
    await db.doc(meta.docPath).set(
      {
        botToken: token,
        botUsername,
        configuredByEmail: req?.user?.email || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Try auto-discovering /start chat right away if user already tapped Start
  try {
    return await connectTelegramAdmin(req, channel);
  } catch {
    if (req) {
      await recordAuditEvent(req, {
        eventType: 'TELEGRAM_BOT_CONFIGURED',
        severity: 'info',
        targetType: 'telegram_bot',
        targetId: `@${botUsername}`,
        status: 'SUCCESS',
        details: `Configured Telegram ${channel} bot (@${botUsername})`,
      });
    }
    return getTelegramStatus(channel);
  }
}

/**
 * Discovers the Admin's Telegram chat_id from recent /start messages via getUpdates and saves it.
 */
export async function connectTelegramAdmin(req, channel = 'support') {
  const meta = resolveChannelMeta(channel);
  const stored = await getStoredTelegramConfig(channel);
  if (!stored.botToken) {
    throw new AppError(
      channel === 'orders'
        ? 'Order Telegram Bot Token is not configured yet.'
        : 'TELEGRAM_BOT_TOKEN is not configured in backend .env.',
      400,
      'TELEGRAM_NOT_CONFIGURED'
    );
  }

  const me = await telegramApiWithToken(stored.botToken, 'getMe').catch(() => null);
  const botUsername = me?.username || stored.botUsername || meta.defaultBotUsername;
  const updates = await telegramApiWithToken(stored.botToken, 'getUpdates');
  const messages = (Array.isArray(updates) ? updates : [])
    .map((u) => u.message || u.edited_message)
    .filter((m) => m?.chat?.id && m.chat.type === 'private');

  if (messages.length === 0) {
    throw new AppError(
      `No /start message found yet. Open @${botUsername} in Telegram, tap Start, then click Connect again.`,
      400,
      'TELEGRAM_NO_START_FOUND'
    );
  }

  const latest = messages[messages.length - 1];
  const chatId = String(latest.chat.id);
  const chatUsername = latest.chat.username
    ? `@${latest.chat.username}`
    : latest.chat.first_name || 'Admin';

  const nowIso = new Date().toISOString();
  if (db) {
    await db.doc(meta.docPath).set(
      {
        chatId,
        chatUsername,
        botUsername,
        connectedByEmail: req?.user?.email || null,
        connectedAt: nowIso,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await telegramApiWithToken(stored.botToken, 'sendMessage', {
    chat_id: chatId,
    text: meta.connectedBanner,
    parse_mode: 'HTML',
  });

  if (req) {
    await recordAuditEvent(req, {
      eventType: 'TELEGRAM_BOT_CONNECTED',
      severity: 'info',
      targetType: 'telegram_bot',
      targetId: `${channel}:${chatUsername}`,
      status: 'SUCCESS',
      details: `Admin connected Telegram ${channel} bot @${botUsername} (${chatUsername})`,
    });
  }

  return getTelegramStatus(channel);
}

export async function sendTelegramAlert(htmlText, channel = 'support') {
  const stored = await getStoredTelegramConfig(channel);
  if (!stored.botToken || !stored.chatId) return false;

  try {
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: stored.chatId,
      text: htmlText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendTelegramTestAlert(channel = 'support') {
  const meta = resolveChannelMeta(channel);
  const stored = await getStoredTelegramConfig(channel);
  if (!stored.botToken) {
    throw new AppError('Telegram Bot Token is not configured yet.', 400, 'TELEGRAM_NOT_CONFIGURED');
  }
  if (!stored.chatId) {
    throw new AppError('Telegram admin chat is not connected yet.', 400, 'TELEGRAM_NOT_CONNECTED');
  }
  await telegramApiWithToken(stored.botToken, 'sendMessage', {
    chat_id: stored.chatId,
    text: meta.testBanner,
    parse_mode: 'HTML',
  });
  return { sent: true };
}

function dedupeLocationParts(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const clean = String(part || '').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out.join(', ');
}

export function notifySupportTicket(ticket) {
  if (!ticket) return;
  const lines = [
    `💬 <b>Support Inquiry</b> · <code>${escapeHtml(ticket.id)}</code>`,
    '',
    `👤 <b>${escapeHtml(ticket.name)}</b>`,
    `📞 ${escapeHtml(ticket.contact)}`,
    `📌 Topic: ${escapeHtml(ticket.topic)}`,
    ticket.orderCode ? `🧾 Order: <code>${escapeHtml(ticket.orderCode)}</code>` : null,
    '',
    `📝 ${escapeHtml(ticket.message)}`,
  ].filter((line) => line !== null);

  sendTelegramAlert(lines.join('\n'), 'support').catch(() => {});
}

export async function notifyNewOrder(order) {
  if (!order) return;
  const orderId = order.id || order.orderNumber || 'Order';
  const total = Number(order.total || 0).toFixed(2);
  const customerName = order.customerName || order.shippingAddress?.fullName || order.customer?.fullName || 'Customer';
  const phone = order.phone || order.shippingAddress?.phone || order.customer?.phone || '-';
  const method = order.paymentMethod || 'N/A';
  const paymentStatus = order.paymentStatus || 'Paid';
  const paymentBadge = String(paymentStatus).toLowerCase() === 'paid' ? '✅ ' : '⏳ ';
  const addr = order.shippingAddress || order.customer || {};
  const locationText = dedupeLocationParts([addr.address, addr.city, addr.province]);

  const items = Array.isArray(order.items) ? order.items : [];
  const totalUnits = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
  const itemBlocks = items.slice(0, 8).map((it, idx) => {
    const qty = Number(it.quantity || 1);
    const lineTotal = (Number(it.price || 0) * qty).toFixed(2);
    const variant = it.selectedVariant || it.variant || '';
    const detailParts = [variant ? `<i>${escapeHtml(variant)}</i>` : null, `x${qty}`, `<b>$${lineTotal}</b>`].filter(Boolean);
    return `${idx + 1}. ${escapeHtml(it.name)}\n   ${detailParts.join(' · ')}`;
  });

  if (items.length > 8) {
    itemBlocks.push(`<i>+${items.length - 8} more item(s)</i>`);
  }

  const lines = [
    `🛒 <b>New Order</b> · <code>${escapeHtml(orderId)}</code>`,
    '',
    '👤 <b>Customer</b>',
    `${escapeHtml(customerName)} · 📞 <code>${escapeHtml(phone)}</code>`,
    locationText ? `📍 ${escapeHtml(locationText)}` : null,
    '',
    `📦 <b>Items</b> (${totalUnits || items.length})`,
    ...(itemBlocks.length > 0 ? itemBlocks : ['-']),
    '',
    order.appliedCoupon
      ? `🏷️ Promo: <code>${escapeHtml(order.appliedCoupon)}</code> (-$${Number(order.discount || 0).toFixed(2)})`
      : null,
    `💰 <b>Total: $${escapeHtml(total)}</b>`,
    `💳 Payment: ${escapeHtml(method)} · ${paymentBadge}${escapeHtml(paymentStatus)}`,
  ].filter((line) => line !== null);

  const html = lines.join('\n');
  await dispatchOrderChannelAlert(html);
}

async function dispatchOrderChannelAlert(html) {
  const sentOnOrderBot = await sendTelegramAlert(html, 'orders');
  if (!sentOnOrderBot) {
    // Fallback to support bot only if dedicated order bot is not yet configured/connected
    const orderConfig = await getStoredTelegramConfig('orders');
    if (!orderConfig.botToken) {
      await sendTelegramAlert(html, 'support');
    }
  }
}

export async function notifyOrderStatusUpdate(order, previousStatus = '') {
  if (!order) return;
  const status = String(order.status || '').trim();
  if (status !== 'Delivered' && status !== 'Cancelled') return;

  const orderId = order.id || order.orderNumber || 'Order';
  const customerName = order.customerName || order.shippingAddress?.fullName || order.customer?.fullName || 'Customer';
  const total = Number(order.total || 0).toFixed(2);
  const title = status === 'Delivered' ? '✅ <b>Order Delivered</b>' : '❌ <b>Order Cancelled</b>';

  const lines = [
    `${title} · <code>${escapeHtml(orderId)}</code>`,
    '',
    `👤 ${escapeHtml(customerName)} · 💰 <b>$${escapeHtml(total)}</b>`,
    previousStatus
      ? `🚚 ${escapeHtml(previousStatus)} → <b>${escapeHtml(status)}</b>`
      : `🚚 Status: <b>${escapeHtml(status)}</b>`,
  ];

  await dispatchOrderChannelAlert(lines.join('\n'));
}
