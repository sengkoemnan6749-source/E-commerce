import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordAuditEvent } from './auditService.js';
import { signPaymentProof } from './paymentSecurity.js';
import { decryptSecret, encryptSecret } from '../utils/cryptoSecrets.js';

const PAIRING_CODE_TTL_MS = 10 * 60 * 1000;

function hashPairingCode(code) {
  return crypto.createHash('sha256').update(String(code || '').trim()).digest('hex');
}

function timingSafeHexEqual(a, b) {
  const strA = String(a || '');
  const strB = String(b || '');
  if (!strA || !strB || strA.length !== strB.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(strA, 'utf8'), Buffer.from(strB, 'utf8'));
  } catch {
    return false;
  }
}

async function issuePairingCode(docPath, issuedByEmail = null) {
  const code = `PAIR_${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
  const expiresAt = Date.now() + PAIRING_CODE_TTL_MS;
  if (db) {
    await db.doc(docPath).set(
      {
        pendingPairingHash: hashPairingCode(code),
        pendingPairingExpiresAt: expiresAt,
        pendingPairingIssuedBy: issuedByEmail || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  return { code, expiresAt };
}

function extractPairingCodeFromText(text = '') {
  const match = String(text || '')
    .trim()
    .match(/^\/start(?:@[A-Za-z0-9_]+)?\s+(PAIR_[A-F0-9]{16,64})$/i);
  return match ? match[1].toUpperCase() : null;
}

const CHANNEL_CONFIG = {
  support: {
    docPath: 'adminSecurityConfig/telegram',
    tokenEnv: 'TELEGRAM_BOT_TOKEN',
    chatEnv: 'TELEGRAM_ADMIN_CHAT_ID',
    defaultBotUsername: 'techtonic_support_bot',
    connectedBanner:
      '✅ <b>TechTonic Support Bot បានភ្ជាប់រួចរាល់!</b>\nរាល់សារជំនួយពីអតិថិជននឹងផ្ញើចូលទីនេះដោយស្វ័យប្រវត្តិ។',
    testBanner:
      '🔔 <b>សាកល្បង TechTonic Support Bot</b>\nប្រព័ន្ធជូនដំណឹងផ្នែកជំនួយដំណើរការល្អប្រសើរ។',
  },
  orders: {
    docPath: 'adminSecurityConfig/telegram_orders',
    tokenEnv: 'TELEGRAM_ORDER_BOT_TOKEN',
    chatEnv: 'TELEGRAM_ORDER_CHAT_ID',
    defaultBotUsername: 'techtonic_order_2026_bot',
    connectedBanner:
      '✅ <b>TechTonic Order Bot បានភ្ជាប់រួចរាល់!</b>\nការបញ្ជាទិញថ្មីៗ និងការផ្ទៀងផ្ទាត់ Bakong KHQR នឹងផ្ញើចូលទីនេះភ្លាមៗ។',
    testBanner:
      '🔔 <b>សាកល្បង TechTonic Order Bot</b>\nប្រព័ន្ធជូនដំណឹងការបញ្ជាទិញដំណើរការល្អប្រសើរ។',
  },
};

const ORDER_BOT_KEYBOARD = {
  keyboard: [
    [
      { text: '📊 សរុបថ្ងៃនេះ', style: 'primary' },
      { text: '📦 ការកម្ម៉ង់ថ្មីៗ', style: 'primary' },
    ],
    [
      { text: '⏳ រង់ចាំដឹកជញ្ជូន', style: 'primary' },
      { text: '💳 រង់ចាំផ្ទៀងផ្ទាត់', style: 'primary' },
    ],
    [
      { text: '⚙️ ស្ថានភាពប្រព័ន្ធ', style: 'primary' },
      { text: '❓ ជំនួយ', style: 'primary' },
    ],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

const STATUS_KM = {
  Pending: 'រង់ចាំបញ្ជាក់',
  Confirmed: 'បានបញ្ជាក់',
  Processing: 'កំពុងរៀបចំ',
  Shipped: 'បានដឹកចេញ',
  'Out for Delivery': 'កំពុងដឹកជញ្ជូន',
  Delivered: 'ប្រគល់ជោគជ័យ',
  Cancelled: 'បានបោះបង់',
};

function translateStatusKm(status) {
  const clean = String(status || '').trim();
  return STATUS_KM[clean] || clean || 'បានបញ្ជាក់';
}

function resolveChannelMeta(channel = 'support') {
  return CHANNEL_CONFIG[channel === 'orders' ? 'orders' : 'support'];
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

function getCambodiaDateKey(dateInput = new Date()) {
  const d =
    dateInput?._seconds
      ? new Date(dateInput._seconds * 1000)
      : dateInput instanceof Date
      ? dateInput
      : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function formatKhmerDateTime(raw) {
  const d = raw?._seconds ? new Date(raw._seconds * 1000) : new Date(raw || Date.now());
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Phnom_Penh',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
  const storedRawToken = String(firestoreConfig?.botToken || '').trim();
  const decryptedToken = storedRawToken ? decryptSecret(storedRawToken) : '';
  const botToken = envToken || decryptedToken || '';
  const envChatId = String(process.env[meta.chatEnv] || '').trim();
  const chatId = envChatId || String(firestoreConfig?.chatId || '').trim() || '';

  return {
    botToken,
    chatId,
    botUsername: firestoreConfig?.botUsername || meta.defaultBotUsername,
    chatUsername: firestoreConfig?.chatUsername || (envChatId ? '@techtonic_admin' : null),
    connectedAt: firestoreConfig?.connectedAt || null,
    pendingPairingHash: firestoreConfig?.pendingPairingHash || null,
    pendingPairingExpiresAt: Number(firestoreConfig?.pendingPairingExpiresAt || 0),
  };
}

async function telegramApiWithToken(token, method, payload = null, { timeoutMs = 8000, externalSignal = null } = {}) {
  if (!token) {
    throw new AppError('Telegram Bot Token is not configured.', 400, 'TELEGRAM_NOT_CONFIGURED');
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  let res;
  try {
    res = await fetch(url, {
      method: payload ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new AppError(
      err?.name === 'AbortError'
        ? `Telegram API request (${method}) timed out`
        : `Telegram API network error: ${err?.message || 'failed'}`,
      502,
      'TELEGRAM_NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }

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
        botToken: encryptSecret(token),
        botUsername,
        configuredByEmail: req?.user?.email || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

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

let orderBotListenerRunning = false;

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

  if (channel === 'orders' && orderBotListenerRunning && stored.chatId) {
    await sendOrderBotWelcomeDashboard(stored, stored.chatUsername || 'Admin');
    return getTelegramStatus(channel);
  }

  const updates = await telegramApiWithToken(stored.botToken, 'getUpdates');
  const messages = (Array.isArray(updates) ? updates : [])
    .map((u) => u.message || u.edited_message)
    .filter((m) => m?.chat?.id && m.chat.type === 'private');

  // Require an authenticated one-time pairing token (/start PAIR_...) instead of trusting any random /start sender
  const hasValidPendingPairing =
    Boolean(stored.pendingPairingHash) && Date.now() < Number(stored.pendingPairingExpiresAt || 0);

  let matchedMessage = null;
  if (hasValidPendingPairing) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const candidateCode = extractPairingCodeFromText(messages[i]?.text || '');
      if (candidateCode && timingSafeHexEqual(hashPairingCode(candidateCode), stored.pendingPairingHash)) {
        matchedMessage = messages[i];
        break;
      }
    }
  }

  if (!matchedMessage) {
    if (stored.chatId) {
      if (channel === 'orders') {
        await sendOrderBotWelcomeDashboard({ ...stored, botUsername }, stored.chatUsername || 'Admin');
      }
      return getTelegramStatus(channel);
    }
    const { code } = await issuePairingCode(meta.docPath, req?.user?.email || null);
    throw new AppError(
      `Verification required: Open @${botUsername} in Telegram and send "/start ${code}" (valid 10 min), then click Connect again.`,
      400,
      'TELEGRAM_PAIRING_REQUIRED'
    );
  }

  const latest = matchedMessage;
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
        pendingPairingHash: FieldValue.delete(),
        pendingPairingExpiresAt: FieldValue.delete(),
        pendingPairingIssuedBy: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  if (channel === 'orders') {
    await sendOrderBotWelcomeDashboard({ ...stored, chatId, botUsername }, chatUsername);
  } else {
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: chatId,
      text: meta.connectedBanner,
      parse_mode: 'HTML',
    });
  }

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

export async function sendTelegramAlert(htmlText, channel = 'support', extraPayload = {}) {
  const stored = await getStoredTelegramConfig(channel);
  if (!stored.botToken || !stored.chatId) return false;

  try {
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: stored.chatId,
      text: htmlText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extraPayload,
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
    ...(channel === 'orders' ? { reply_markup: ORDER_BOT_KEYBOARD } : {}),
  });
  return { sent: true };
}

export function notifySupportTicket(ticket) {
  if (!ticket) return Promise.resolve(false);
  const lines = [
    `💬 <b>សារជំនួយពីអតិថិជន</b> · <code>${escapeHtml(ticket.id)}</code>`,
    '',
    `👤 <b>${escapeHtml(ticket.name)}</b>`,
    `📞 ${escapeHtml(ticket.contact)}`,
    `📌 ប្រធានបទ៖ ${escapeHtml(ticket.topic)}`,
    ticket.orderCode ? `🧾 លេខកម្ម៉ង់៖ <code>${escapeHtml(ticket.orderCode)}</code>` : null,
    '',
    `📝 ${escapeHtml(ticket.message)}`,
  ].filter((line) => line !== null);

  return sendTelegramAlert(lines.join('\n'), 'support').catch(() => false);
}

async function getOrderStatsSummary() {
  const todayKey = getCambodiaDateKey(new Date());
  if (!db) {
    return {
      todayKey,
      todayCount: 0,
      todayRevenue: 0,
      deliveredToday: 0,
      activeCount: 0,
      todayOrders: [],
      recentOrders: [],
      pendingOrders: [],
    };
  }

  const snap = await db.collection('orders').get();
  const allOrders = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  const todayOrders = allOrders.filter((o) => getCambodiaDateKey(o.createdAt) === todayKey);
  const todayRevenue = todayOrders
    .filter((o) => String(o.status || '') !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const deliveredToday = todayOrders.filter((o) => String(o.status || '') === 'Delivered').length;
  const pendingOrders = allOrders.filter((o) => {
    const st = String(o.status || '');
    return st !== 'Delivered' && st !== 'Cancelled';
  });

  return {
    todayKey,
    todayCount: todayOrders.length,
    todayRevenue,
    deliveredToday,
    activeCount: pendingOrders.length,
    todayOrders,
    recentOrders: allOrders.slice(0, 8),
    pendingOrders: pendingOrders.slice(0, 8),
  };
}

function formatOrderAmountLabel(order) {
  const numUsd = Number(order?.total || 0);
  const usdStr = `$${numUsd.toFixed(2)}`;
  const method = String(order?.paymentMethod || '').toLowerCase();
  if (method.includes('(khr)') || method.includes('riel') || method.includes('៛')) {
    const khrVal = Math.max(1, Math.round(numUsd * 4100));
    return `${new Intl.NumberFormat('en-US').format(khrVal)} ៛ (${usdStr})`;
  }
  return usdStr;
}

export async function notifyNewOrder(order) {
  if (!order) return;
  const orderId = order.id || order.orderNumber || 'Order';
  const totalLabel = formatOrderAmountLabel(order);
  const customerName = order.customerName || order.shippingAddress?.fullName || order.customer?.fullName || 'អតិថិជន';
  const phone = order.phone || order.shippingAddress?.phone || order.customer?.phone || '-';
  const method = order.paymentMethod || 'KHQR Bakong';
  const paymentStatus = order.paymentStatus || 'Paid';
  const isPaid = String(paymentStatus).toLowerCase() === 'paid';
  const verifiedActor = order.paymentVerification?.verifiedByTelegramUser || '';
  const addr = order.shippingAddress || order.customer || {};
  const locationText = dedupeLocationParts([addr.address, addr.city, addr.province]);

  let todaySeqLabel = '';
  try {
    const summary = await getOrderStatsSummary();
    if (summary.todayCount > 0) {
      todaySeqLabel = ` · ថ្ងៃនេះទី <b>#${summary.todayCount}</b>`;
    }
  } catch {
    // non-fatal
  }

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
    itemBlocks.push(`<i>+${items.length - 8} មុខទៀត</i>`);
  }

  const paidBadge = isPaid
    ? verifiedActor
      ? `✅ បានទូទាត់ (${escapeHtml(verifiedActor)})`
      : '✅ បានទូទាត់'
    : '⏳ រង់ចាំ';

  const lines = [
    `🛒 <b>ការបញ្ជាទិញថ្មី</b> · <code>${escapeHtml(orderId)}</code>${todaySeqLabel}`,
    '',
    '👤 <b>អតិថិជន</b>',
    `${escapeHtml(customerName)} · 📞 <code>${escapeHtml(phone)}</code>`,
    locationText ? `📍 ${escapeHtml(locationText)}` : null,
    '',
    `📦 <b>ទំនិញ</b> (${totalUnits || items.length})`,
    ...(itemBlocks.length > 0 ? itemBlocks : ['-']),
    '',
    order.appliedCoupon
      ? `🏷️ កូដបញ្ចុះតម្លៃ៖ <code>${escapeHtml(order.appliedCoupon)}</code> (-$${Number(order.discount || 0).toFixed(2)})`
      : null,
    `💰 <b>សរុប៖ ${escapeHtml(totalLabel)}</b>`,
    `💳 ការទូទាត់៖ ${escapeHtml(method)} · ${paidBadge}`,
  ].filter((line) => line !== null);

  await dispatchOrderChannelAlert(lines.join('\n'), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚚 កំពុងដឹកចេញ', callback_data: `ord_ship:${orderId}` },
          { text: '✅ ប្រគល់ជោគជ័យ', callback_data: `ord_del:${orderId}` },
        ],
      ],
    },
  });
}

async function dispatchOrderChannelAlert(html, extraPayload = {}) {
  const sentOnOrderBot = await sendTelegramAlert(html, 'orders', extraPayload);
  if (!sentOnOrderBot) {
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
  const customerName = order.customerName || order.shippingAddress?.fullName || order.customer?.fullName || 'អតិថិជន';
  const total = Number(order.total || 0).toFixed(2);
  const title = status === 'Delivered' ? '✅ <b>ប្រគល់ទំនិញជោគជ័យ</b>' : '❌ <b>ការបញ្ជាទិញត្រូវបានបោះបង់</b>';

  const lines = [
    `${title} · <code>${escapeHtml(orderId)}</code>`,
    '',
    `👤 ${escapeHtml(customerName)} · 💰 <b>$${escapeHtml(total)}</b>`,
    previousStatus
      ? `🚚 ${escapeHtml(translateStatusKm(previousStatus))} → <b>${escapeHtml(translateStatusKm(status))}</b>`
      : `🚚 ស្ថានភាព៖ <b>${escapeHtml(translateStatusKm(status))}</b>`,
  ];

  await dispatchOrderChannelAlert(lines.join('\n'));
}

async function resolveOrderChannelConfig() {
  const ordersConfig = await getStoredTelegramConfig('orders');
  if (ordersConfig.botToken && ordersConfig.chatId) {
    return ordersConfig;
  }
  if (!ordersConfig.botToken) {
    const supportConfig = await getStoredTelegramConfig('support');
    if (supportConfig.botToken && supportConfig.chatId) {
      return supportConfig;
    }
  }
  return null;
}

export async function isOrderTelegramReady() {
  const cfg = await resolveOrderChannelConfig();
  return Boolean(cfg?.botToken && cfg?.chatId);
}

export async function sendOrderPaymentVerificationPrompt({
  transactionId,
  billNumber = null,
  amount,
  currency = 'USD',
  bakongAccountId = 'seng_koemnan@bkrt',
  customerName = 'អតិថិជន',
  customerPhone = '-',
} = {}) {
  const stored = await resolveOrderChannelConfig();
  if (!stored) {
    throw new AppError('Order Telegram Bot is not connected.', 400, 'TELEGRAM_NOT_CONNECTED');
  }

  const amountLabel =
    currency === 'KHR'
      ? `${new Intl.NumberFormat('en-US').format(Math.round(Number(amount || 0)))} ៛ (KHR)`
      : `$${Number(amount || 0).toFixed(2)} (USD)`;

  const billLine = billNumber ? `\n🏷️ <b>លេខវិក្កយបត្រ KHQR៖</b> <code>${escapeHtml(billNumber)}</code>` : '';

  const lines = [
    '💳 <b>ផ្ទៀងផ្ទាត់ការទូទាត់ Bakong KHQR</b>',
    '',
    `<blockquote>💰 <b>ចំនួនទឹកប្រាក់៖</b> <b>${escapeHtml(amountLabel)}</b>\n👤 <b>អតិថិជនកម្ម៉ង់៖</b> <b>${escapeHtml(customerName || 'អតិថិជន')}</b> · 📞 <code>${escapeHtml(customerPhone || '-')}</code>${billLine}</blockquote>`,
    `🧾 <b>លេខប្រតិបត្តិការ៖</b> <code>${escapeHtml(transactionId)}</code>`,
    `📥 <b>ចូលគណនី៖</b> <code>${escapeHtml(bakongAccountId)}</code>`,
    '',
    '👇 <i>ពិនិត្យទឹកប្រាក់ចូលក្នុងទូរស័ព្ទ រួចចុចប៊ូតុងខាងក្រោម៖</i>',
  ];

  const sent = await telegramApiWithToken(stored.botToken, 'sendMessage', {
    chat_id: stored.chatId,
    text: lines.join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ បញ្ជាក់បានទទួលប្រាក់', callback_data: `khqr_ok:${transactionId}`, style: 'success' },
          { text: '❌ មិនទាន់ឃើញចូល', callback_data: `khqr_no:${transactionId}`, style: 'danger' },
        ],
      ],
    },
  });

  return {
    sent: true,
    messageId: sent?.message_id || null,
    botUsername: stored.botUsername || null,
  };
}

export async function notifySecurityAlert({
  reason = 'PAYMENT_BYPASS_ATTEMPT',
  details = '',
  transactionId = null,
  actorEmail = null,
  actorUid = null,
  ip = null,
} = {}) {
  const lines = [
    '🚨 <b>ព្រមានសុវត្ថិភាព! (Payment Security Alert)</b>',
    '',
    `<blockquote>🛡️ <b>មូលហេតុ៖</b> <code>${escapeHtml(reason)}</code>\n📝 <b>ព័ត៌មានលម្អិត៖</b> ${escapeHtml(details || 'Suspicious payment request blocked')}${
      transactionId ? `\n🧾 <b>Tx:</b> <code>${escapeHtml(transactionId)}</code>` : ''
    }${actorEmail ? `\n👤 <b>គណនី៖</b> ${escapeHtml(actorEmail)}` : actorUid ? `\n👤 <b>UID:</b> <code>${escapeHtml(actorUid)}</code>` : ''}${
      ip ? `\n🌐 <b>IP:</b> <code>${escapeHtml(ip)}</code>` : ''
    }</blockquote>`,
    '🔒 <i>ប្រព័ន្ធបានទប់ស្កាត់ដោយស្វ័យប្រវត្តិ (Blocked)។</i>',
  ];

  const sent = await sendTelegramAlert(lines.join('\n'), 'orders').catch(() => ({ sent: false }));
  if (!sent?.sent) {
    await sendTelegramAlert(lines.join('\n'), 'support').catch(() => {});
  }
}

async function buildTodayReportHtml() {
  const summary = await getOrderStatsSummary();
  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━',
    `📊 <b>របាយការណ៍ការបញ្ជាទិញថ្ងៃនេះ</b> (${escapeHtml(summary.todayKey)})`,
    '━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `<blockquote>📦 <b>ការកម្ម៉ង់ថ្ងៃនេះ៖</b> <b>${summary.todayCount} កម្ម៉ង់</b>\n💰 <b>ចំណូលសរុបថ្ងៃនេះ៖</b> <b>$${summary.todayRevenue.toFixed(2)}</b>\n✅ <b>ប្រគល់ជោគជ័យ៖</b> ${summary.deliveredToday}  |  ⏳ <b>កំពុងដំណើរការ៖</b> ${summary.activeCount}</blockquote>`,
  ];

  if (summary.todayOrders.length === 0) {
    lines.push('', '📭 <i>មិនទាន់មានការបញ្ជាទិញថ្មីសម្រាប់ថ្ងៃនេះនៅឡើយទេ។</i>');
  } else {
    lines.push('', '<b>បញ្ជីការបញ្ជាទិញថ្ងៃនេះ៖</b>');
    summary.todayOrders.slice(0, 10).forEach((o, idx) => {
      const cust = o.customer?.fullName || o.shippingAddress?.fullName || 'អតិថិជន';
      const amtLabel = formatOrderAmountLabel(o);
      lines.push(
        `${idx + 1}. <code>${escapeHtml(o.id)}</code> — <b>${escapeHtml(amtLabel)}</b>\n   👤 ${escapeHtml(cust)} · <i>${escapeHtml(translateStatusKm(o.status))}</i>`
      );
    });
  }
  return lines.join('\n');
}

async function buildRecentOrdersHtml() {
  const summary = await getOrderStatsSummary();
  const lines = ['📦 <b>ការបញ្ជាទិញថ្មីៗបំផុត (៨ ចុងក្រោយ)</b>', ''];
  if (summary.recentOrders.length === 0) {
    lines.push('📭 <i>មិនទាន់មានទិន្នន័យការបញ្ជាទិញទេ។</i>');
  } else {
    summary.recentOrders.forEach((o, idx) => {
      const cust = o.customer?.fullName || o.shippingAddress?.fullName || 'អតិថិជន';
      const amtLabel = formatOrderAmountLabel(o);
      lines.push(
        `${idx + 1}. <code>${escapeHtml(o.id)}</code> · <b>${escapeHtml(amtLabel)}</b>\n   👤 ${escapeHtml(cust)} · ${escapeHtml(translateStatusKm(o.status))}\n   🕒 ${escapeHtml(formatKhmerDateTime(o.createdAt))}`
      );
    });
  }
  return lines.join('\n');
}

export async function sendOrderBotWelcomeDashboard(stored, adminName = 'Admin') {
  const summary = await getOrderStatsSummary().catch(() => ({
    todayCount: 0,
    todayRevenue: 0,
    activeCount: 0,
  }));

  const text = [
    '━━━━━━━━━━━━━━━━━━━━━━',
    '⚡ <b>TECHTONIC ORDER BOT v2.0</b>',
    '🟢 ស្ថានភាព៖ <b>ONLINE</b>  |  🛡️ សុវត្ថិភាព៖ <b>សកម្ម</b>',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `👋 សូមស្វាគមន៍, <b>${escapeHtml(adminName)}</b>!`,
    '',
    `<blockquote>📦 <b>ប្រព័ន្ធគ្រប់គ្រងការបញ្ជាទិញ &amp; Bakong KHQR</b>\n• កម្ម៉ង់ថ្ងៃនេះ៖ <b>${summary.todayCount} កម្ម៉ង់</b> (<b>$${Number(summary.todayRevenue || 0).toFixed(2)}</b>)\n• កំពុងរង់ចាំដឹក៖ <b>${summary.activeCount} កម្ម៉ង់</b></blockquote>`,
    '',
    '👇 <i>សូមជ្រើសរើសមុខងារពីប៊ូតុងខាងក្រោម៖</i>',
  ].join('\n');

  await telegramApiWithToken(stored.botToken, 'sendMessage', {
    chat_id: stored.chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: ORDER_BOT_KEYBOARD,
  });
}

async function handleOrderStatusInlineAction(orderId, targetStatus, cb, stored) {
  const actor = cb.from?.username ? `@${cb.from.username}` : cb.from?.first_name || 'Admin';
  if (!db || !orderId) return null;

  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) {
    await telegramApiWithToken(stored.botToken, 'answerCallbackQuery', {
      callback_query_id: cb.id,
      text: 'រកមិនឃើញលេខកម្ម៉ង់នេះទេ។',
      show_alert: true,
    }).catch(() => {});
    return null;
  }

  const existing = snap.data() || {};
  const nextStep = targetStatus === 'Delivered' ? 4 : 3;
  const tracking = existing.tracking || {};
  const events = Array.isArray(tracking.events) ? [...tracking.events] : [];
  events.push({
    status: targetStatus,
    location:
      targetStatus === 'Delivered'
        ? dedupeLocationParts([existing.shippingAddress?.address, existing.shippingAddress?.city, existing.shippingAddress?.province]) || 'Phnom Penh'
        : `Dispatched via ${tracking.courier || 'Courier Fleet'}`,
    note: `Updated via Telegram (${actor})`,
    timestamp: new Date().toISOString(),
  });

  await orderRef.set(
    {
      status: targetStatus,
      stepIndex: nextStep,
      tracking: { ...tracking, events: events.slice(-20) },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await telegramApiWithToken(stored.botToken, 'answerCallbackQuery', {
    callback_query_id: cb.id,
    text: `បានប្តូរទៅ ${translateStatusKm(targetStatus)}!`,
  }).catch(() => {});

  if (cb.message?.chat?.id && cb.message?.message_id) {
    const baseText = cb.message.text || `Order: ${orderId}`;
    const note = `\n\n📌 <b>ស្ថានភាពថ្មី៖ ${escapeHtml(translateStatusKm(targetStatus))}</b> (${escapeHtml(actor)})`;
    await telegramApiWithToken(stored.botToken, 'editMessageText', {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: `${escapeHtml(baseText)}${note}`,
      parse_mode: 'HTML',
      reply_markup: targetStatus === 'Delivered'
        ? { inline_keyboard: [] }
        : { inline_keyboard: [[{ text: '✅ ប្រគល់ជោគជ័យ', callback_data: `ord_del:${orderId}` }]] },
    }).catch(() => {});
  }

  return { orderId, status: targetStatus, actor };
}

async function handleOrderBotCallback(cb, stored) {
  const data = String(cb?.data || '');
  const senderId = String(cb?.from?.id || '');
  const chatId = String(cb?.message?.chat?.id || '');
  const expectedChatId = String(stored.chatId || '').trim();

  if (!expectedChatId || !senderId || senderId !== expectedChatId || chatId !== expectedChatId) {
    await telegramApiWithToken(stored.botToken, 'answerCallbackQuery', {
      callback_query_id: cb.id,
      text: 'អ្នកមិនមានសិទ្ធិប្រើប្រាស់ប៊ូតុងនេះទេ។',
      show_alert: true,
    }).catch(() => {});
    return null;
  }

  if (data.startsWith('ord_ship:')) {
    return handleOrderStatusInlineAction(data.slice(9).trim(), 'Shipped', cb, stored);
  }
  if (data.startsWith('ord_del:')) {
    return handleOrderStatusInlineAction(data.slice(8).trim(), 'Delivered', cb, stored);
  }

  if (!data.startsWith('khqr_ok:') && !data.startsWith('khqr_no:')) {
    return null;
  }

  const isApprove = data.startsWith('khqr_ok:');
  const transactionId = data.slice(8).trim();
  const nextStatus = isApprove ? 'PAID' : 'REJECTED';
  const actor = cb.from?.username ? `@${cb.from.username}` : cb.from?.first_name || 'Admin';
  const nowIso = new Date().toISOString();

  let txOutcome = { ok: true, notice: null };
  if (db && transactionId) {
    const payRef = db.collection('payments').doc(transactionId);
    txOutcome = await db.runTransaction(async (tx) => {
      const snap = await tx.get(payRef);
      if (!snap.exists) {
        return { ok: false, notice: 'រកមិនឃើញលេខប្រតិបត្តិការនេះទេ។' };
      }

      const pay = snap.data() || {};
      if (pay.consumedOrderId) {
        return { ok: false, notice: `ប្រតិបត្តិការនេះត្រូវបានប្រើសម្រាប់ ${pay.consumedOrderId} រួចហើយ។` };
      }
      if (pay.status === 'PAID') {
        return { ok: true, notice: 'ប្រតិបត្តិការនេះត្រូវបានបញ្ជាក់រួចហើយ។' };
      }
      if (isApprove && pay.expiresAt && Date.now() > Date.parse(pay.expiresAt)) {
        tx.set(
          payRef,
          { status: 'EXPIRED', updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        return { ok: false, notice: 'កូដ QR នេះផុតកំណត់ហើយ! សូមឱ្យអតិថិជនបង្កើត QR ថ្មី។' };
      }

      const updates = {
        status: nextStatus,
        verifiedBy: 'telegram_admin',
        verifiedByTelegramUser: actor,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (isApprove) {
        updates.paidAt = nowIso;
        updates.verificationProof = signPaymentProof({
          ...pay,
          transactionId,
          status: 'PAID',
          verifiedBy: 'telegram_admin',
          paidAt: nowIso,
        });
      } else {
        updates.rejectedAt = nowIso;
      }
      tx.set(payRef, updates, { merge: true });

      const orderId = pay.orderId;
      if (isApprove && orderId) {
        const orderRef = db.collection('orders').doc(String(orderId));
        tx.set(
          orderRef,
          { paymentStatus: 'Paid', transactionId, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }
      return { ok: true, notice: null };
    });
  }

  if (!txOutcome.ok) {
    await telegramApiWithToken(stored.botToken, 'answerCallbackQuery', {
      callback_query_id: cb.id,
      text: txOutcome.notice || 'មិនអាចបញ្ជាក់ប្រតិបត្តិការនេះបានទេ។',
      show_alert: true,
    }).catch(() => {});
    return null;
  }

  await telegramApiWithToken(stored.botToken, 'answerCallbackQuery', {
    callback_query_id: cb.id,
    text:
      txOutcome.notice ||
      (isApprove ? '✅ បានបញ្ជាក់ការទូទាត់ជោគជ័យ!' : '❌ បានសម្គាល់ថាមិនទាន់ទទួលប្រាក់'),
  }).catch(() => {});

  if (cb.message?.chat?.id && cb.message?.message_id) {
    const baseText = cb.message.text || `KHQR Tx: ${transactionId}`;
    const decisionLine = isApprove
      ? `\n\n✅ <b>បានបញ្ជាក់ទទួលប្រាក់រួច</b> ដោយ ${escapeHtml(actor)}`
      : `\n\n❌ <b>មិនទាន់ឃើញលុយចូល</b> (${escapeHtml(actor)})`;
    await telegramApiWithToken(stored.botToken, 'editMessageText', {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: `${escapeHtml(baseText)}${decisionLine}`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] },
    }).catch(() => {});
  }

  return { transactionId, status: nextStatus, actor };
}

async function handleOrderBotMessage(msg, stored) {
  if (!msg?.chat?.id || msg.chat.type !== 'private') return;
  const text = String(msg.text || '').trim();
  const chatId = String(msg.chat.id);
  const senderName = msg.from?.first_name || msg.chat.first_name || 'Admin';
  const senderUsername = msg.from?.username ? `@${msg.from.username}` : senderName;

  // Bind admin chat ONLY when presented with a valid unexpired one-time pairing token issued by an authenticated Admin
  const pairingCode = extractPairingCodeFromText(text);
  if (
    pairingCode &&
    !stored.chatId &&
    db &&
    stored.pendingPairingHash &&
    Date.now() < Number(stored.pendingPairingExpiresAt || 0) &&
    timingSafeHexEqual(hashPairingCode(pairingCode), stored.pendingPairingHash)
  ) {
    const meta = resolveChannelMeta('orders');
    await db.doc(meta.docPath).set(
      {
        chatId,
        chatUsername: senderUsername,
        connectedAt: new Date().toISOString(),
        pendingPairingHash: FieldValue.delete(),
        pendingPairingExpiresAt: FieldValue.delete(),
        pendingPairingIssuedBy: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    stored = { ...stored, chatId, chatUsername: senderUsername };
  }

  // Strictly reject any message if no admin chatId is bound or sender does not match the authorized admin chatId
  if (!stored.chatId || chatId !== String(stored.chatId)) {
    return;
  }

  if (text.startsWith('/start') || text === '🏠 ម៉ឺនុយ') {
    await sendOrderBotWelcomeDashboard(stored, senderName);
    return;
  }

  if (text === '📊 សរុបថ្ងៃនេះ' || text.startsWith('/today')) {
    const html = await buildTodayReportHtml();
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      reply_markup: ORDER_BOT_KEYBOARD,
    });
    return;
  }

  if (text === '📦 ការកម្ម៉ង់ថ្មីៗ' || text.startsWith('/orders')) {
    const html = await buildRecentOrdersHtml();
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      reply_markup: ORDER_BOT_KEYBOARD,
    });
    return;
  }

  if (text === '⏳ រង់ចាំដឹកជញ្ជូន' || text.startsWith('/pending')) {
    const summary = await getOrderStatsSummary();
    if (summary.pendingOrders.length === 0) {
      await telegramApiWithToken(stored.botToken, 'sendMessage', {
        chat_id: chatId,
        text: '✅ <b>មិនមានការបញ្ជាទិញកំពុងរង់ចាំដឹកជញ្ជូនទេ!</b>',
        parse_mode: 'HTML',
        reply_markup: ORDER_BOT_KEYBOARD,
      });
      return;
    }

    const lines = [`⏳ <b>ការបញ្ជាទិញកំពុងរង់ចាំដឹកជញ្ជូន (${summary.pendingOrders.length})</b>`, ''];
    summary.pendingOrders.forEach((o, i) => {
      const cust = o.customer?.fullName || o.shippingAddress?.fullName || 'អតិថិជន';
      const phone = o.customer?.phone || o.shippingAddress?.phone || '-';
      lines.push(
        `${i + 1}. <code>${escapeHtml(o.id)}</code> · <b>$${Number(o.total || 0).toFixed(2)}</b>\n   👤 ${escapeHtml(cust)} (${escapeHtml(phone)})\n   📌 <i>${escapeHtml(translateStatusKm(o.status))}</i>`
      );
    });
    const first = summary.pendingOrders[0];
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: chatId,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: `🚚 ចាត់ដឹក (${first.id.slice(-4)})`, callback_data: `ord_ship:${first.id}` },
            { text: `✅ ប្រគល់រួច (${first.id.slice(-4)})`, callback_data: `ord_del:${first.id}` },
          ],
        ],
      },
    });
    return;
  }

  if (text === '💳 រង់ចាំផ្ទៀងផ្ទាត់' || text.startsWith('/verify')) {
    if (!db) return;
    const paySnap = await db.collection('payments').where('status', '==', 'AWAITING_ADMIN').get();
    if (paySnap.empty) {
      await telegramApiWithToken(stored.botToken, 'sendMessage', {
        chat_id: chatId,
        text: '✅ <b>មិនមានប្រតិបត្តិការ Bakong KHQR រង់ចាំផ្ទៀងផ្ទាត់ទេ!</b>',
        parse_mode: 'HTML',
        reply_markup: ORDER_BOT_KEYBOARD,
      });
      return;
    }
    for (const doc of paySnap.docs.slice(0, 5)) {
      const p = doc.data();
      await sendOrderPaymentVerificationPrompt({
        transactionId: p.transactionId || doc.id,
        amount: p.amount,
        currency: p.currency,
        bakongAccountId: p.bakongAccountId,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        payerAccountName: p.payerAccountName,
      });
    }
    return;
  }

  if (text === '⚙️ ស្ថានភាពប្រព័ន្ធ' || text.startsWith('/status')) {
    const summary = await getOrderStatsSummary().catch(() => ({ todayCount: 0, activeCount: 0 }));
    const bakongId = process.env.BAKONG_ACCOUNT_ID || 'seng_koemnan@bkrt';
    const hasToken = Boolean(String(process.env.BAKONG_TOKEN || '').trim());
    const html = [
      '⚙️ <b>ស្ថានភាពប្រព័ន្ធ TechTonic</b>',
      '',
      `<blockquote>🟢 Server៖ <b>ONLINE</b>\n🤖 Bot៖ <b>@${escapeHtml(stored.botUsername)}</b>\n🏦 Bakong៖ <code>${escapeHtml(bakongId)}</code>\n🔐 ផ្ទៀងផ្ទាត់ប្រាក់៖ <b>${hasToken ? 'NBC Auto-API' : 'Telegram 1-Tap'}</b>\n📦 កម្ម៉ង់ថ្ងៃនេះ៖ <b>${summary.todayCount}</b> (រង់ចាំ៖ ${summary.activeCount})</blockquote>`,
    ].join('\n');
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      reply_markup: ORDER_BOT_KEYBOARD,
    });
    return;
  }

  if (text === '❓ ជំនួយ' || text.startsWith('/help')) {
    const html = [
      '❓ <b>មគ្គុទ្ទេសក៍ប្រើប្រាស់ Order Bot</b>',
      '',
      '• <b>📊 សរុបថ្ងៃនេះ</b> (/today) — មើលចំនួនការកម្ម៉ង់ &amp; ចំណូលសរុបប្រចាំថ្ងៃ',
      '• <b>📦 ការកម្ម៉ង់ថ្មីៗ</b> (/orders) — មើល ៨ កម្ម៉ង់ចុងក្រោយ',
      '• <b>⏳ រង់ចាំដឹកជញ្ជូន</b> (/pending) — មើលកម្ម៉ង់មិនទាន់ដឹក និងប្តូរស្ថានភាពភ្លាម',
      '• <b>💳 រង់ចាំផ្ទៀងផ្ទាត់</b> (/verify) — ហៅសំណើផ្ទៀងផ្ទាត់ KHQR ដែលនៅសល់',
      '• <b>⚙️ ស្ថានភាពប្រព័ន្ធ</b> (/status) — ពិនិត្យ Bot &amp; Bakong KHQR',
      '',
      '👉 <i>ពេលអតិថិជនស្កេនបង់ KHQR ឈ្មោះគណនីអ្នកផ្ទេរនឹងបង្ហាញធំៗ ដើម្បីងាយផ្ទៀងផ្ទាត់លើទូរស័ព្ទ!</i>',
    ].join('\n');
    await telegramApiWithToken(stored.botToken, 'sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      reply_markup: ORDER_BOT_KEYBOARD,
    });
  }
}

async function processOrderBotUpdate(upd, stored) {
  if (!upd) return null;
  if (upd.callback_query) {
    return handleOrderBotCallback(upd.callback_query, stored);
  }
  if (upd.message) {
    await handleOrderBotMessage(upd.message, stored);
  }
  return null;
}

let lastOrderCallbackOffset = 0;
let activeOrderPollPromise = null;
let listenerController = null;

export async function pollOrderPaymentCallbacks() {
  if (orderBotListenerRunning) {
    // Background long-poller handles updates continuously without 409 conflict
    return [];
  }
  if (activeOrderPollPromise) {
    return activeOrderPollPromise;
  }

  activeOrderPollPromise = (async () => {
    const stored = await resolveOrderChannelConfig();
    if (!stored) return [];

    try {
      const params = {
        allowed_updates: ['callback_query', 'message'],
        timeout: 0,
        ...(lastOrderCallbackOffset > 0 ? { offset: lastOrderCallbackOffset } : {}),
      };
      const updates = await telegramApiWithToken(stored.botToken, 'getUpdates', params);
      if (!Array.isArray(updates) || updates.length === 0) return [];

      const results = [];
      for (const upd of updates) {
        if (typeof upd.update_id === 'number' && upd.update_id >= lastOrderCallbackOffset) {
          lastOrderCallbackOffset = upd.update_id + 1;
        }
        const res = await processOrderBotUpdate(upd, stored);
        if (res) results.push(res);
      }
      return results;
    } catch (err) {
      console.warn('[Telegram Poll]', err?.message || 'Poll skipped');
      return [];
    } finally {
      activeOrderPollPromise = null;
    }
  })();

  return activeOrderPollPromise;
}

export async function processTelegramPaymentWebhook(update) {
  const stored = await resolveOrderChannelConfig();
  if (!stored || !update) return null;
  return processOrderBotUpdate(update, stored);
}

/**
 * Starts a single long-polling listener for @techtonic_order_2026_bot menu buttons & 1-tap confirms.
 */
export async function startOrderBotListener() {
  if (orderBotListenerRunning || process.env.NODE_ENV === 'test' || process.env.VERCEL === '1') {
    return;
  }

  const stored = await getStoredTelegramConfig('orders');
  if (!stored.botToken) return;

  orderBotListenerRunning = true;
  listenerController = new AbortController();

  const stopListener = () => {
    orderBotListenerRunning = false;
    listenerController?.abort();
  };
  process.once('SIGINT', stopListener);
  process.once('SIGTERM', stopListener);
  process.once('SIGUSR2', stopListener);

  // Register bottom-left Telegram Menu commands
  telegramApiWithToken(stored.botToken, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'បើកម៉ឺនុយគ្រប់គ្រងការកម្ម៉ង់' },
      { command: 'today', description: 'មើលចំនួនការកម្ម៉ង់ និងចំណូលថ្ងៃនេះ' },
      { command: 'orders', description: 'មើលការកម្ម៉ង់ថ្មីៗ' },
      { command: 'pending', description: 'មើលការកម្ម៉ង់រង់ចាំដឹកជញ្ជូន' },
      { command: 'verify', description: 'ពិនិត្យការទូទាត់ KHQR រង់ចាំផ្ទៀងផ្ទាត់' },
      { command: 'status', description: 'ពិនិត្យស្ថានភាពប្រព័ន្ធ' },
    ],
  }).catch(() => {});

  const loop = async () => {
    // Brief startup delay so previous nodemon child finishes closing socket cleanly
    await new Promise((r) => setTimeout(r, 800));
    while (orderBotListenerRunning && !listenerController.signal.aborted) {
      try {
        const liveCfg = await getStoredTelegramConfig('orders');
        if (!liveCfg.botToken) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        const updates = await telegramApiWithToken(
          liveCfg.botToken,
          'getUpdates',
          {
            allowed_updates: ['callback_query', 'message'],
            timeout: 15,
            ...(lastOrderCallbackOffset > 0 ? { offset: lastOrderCallbackOffset } : {}),
          },
          { timeoutMs: 20000, externalSignal: listenerController.signal }
        );

        if (Array.isArray(updates) && updates.length > 0) {
          for (const upd of updates) {
            if (typeof upd.update_id === 'number' && upd.update_id >= lastOrderCallbackOffset) {
              lastOrderCallbackOffset = upd.update_id + 1;
            }
            await processOrderBotUpdate(upd, liveCfg);
          }
        }
      } catch (err) {
        if (!orderBotListenerRunning || listenerController.signal.aborted) break;
        const msg = String(err?.message || '');
        await new Promise((r) => setTimeout(r, msg.includes('Conflict') ? 3000 : 2000));
      }
    }
  };

  loop().catch(() => {});
}
