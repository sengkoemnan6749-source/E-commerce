import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';

let cachedTransporter = null;
let transporterChecked = false;

export function getEmailConfigStatus() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const configured = Boolean(host && user && pass);
  return {
    configured,
    host: host || null,
    port: Number(process.env.SMTP_PORT || 587),
    from: process.env.SMTP_FROM || (user ? `TechTonic Store <${user}>` : 'TechTonic Store <no-reply@techtonic.store>'),
  };
}

async function getTransporter() {
  if (transporterChecked) {
    return cachedTransporter;
  }
  transporterChecked = true;
  const cfg = getEmailConfigStatus();
  if (!cfg.configured) {
    return null;
  }
  try {
    const mod = await import('nodemailer');
    const nodemailer = mod.default || mod;
    cachedTransporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465 || String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] nodemailer unavailable, queuing emails in Firestore outbox:', err.message);
    return null;
  }
}

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFrontendBaseUrl() {
  const raw = String(process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')[0]
    .trim();
  return raw || 'http://localhost:3000';
}

/**
 * Dispatches a transactional email via SMTP when configured, and always records an entry in Firestore emailOutbox.
 */
export async function sendTransactionalEmail({ to, subject, text, html, type = 'GENERAL', refId = null }) {
  const recipient = String(to || '').trim();
  if (!recipient || !recipient.includes('@')) {
    return { delivered: false, status: 'SKIPPED_NO_RECIPIENT' };
  }

  const cfg = getEmailConfigStatus();
  const transporter = await getTransporter();
  let status = 'QUEUED_NO_SMTP';
  let errorMessage = null;
  let messageId = null;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: cfg.from,
        to: recipient,
        subject,
        text,
        html,
      });
      status = 'SENT';
      messageId = info?.messageId || null;
    } catch (err) {
      status = 'FAILED';
      errorMessage = err?.message || 'SMTP send failed';
      console.warn(`[EmailService] Failed sending "${type}" to ${recipient}:`, errorMessage);
    }
  }

  if (db) {
    try {
      await db.collection('emailOutbox').add({
        to: recipient,
        subject,
        type,
        refId,
        status,
        messageId,
        error: errorMessage,
        textPreview: String(text || '').slice(0, 500),
        createdAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch {
      // Never throw on outbox logging failure
    }
  }

  return { delivered: status === 'SENT', status, messageId, error: errorMessage };
}

export async function sendOrderConfirmationEmail(order) {
  const to = order?.shippingAddress?.email || order?.customer?.email || order?.customerEmail;
  if (!to) return { delivered: false, status: 'SKIPPED_NO_EMAIL' };

  const orderId = order.id;
  const customerName = order.shippingAddress?.fullName || order.customer?.fullName || 'Customer';
  const total = Number(order.total || 0).toFixed(2);
  const trackUrl = `${getFrontendBaseUrl()}/orders/${encodeURIComponent(orderId)}`;

  const itemsListText = (order.items || [])
    .map((item) => `- ${item.name} x${item.quantity} ($${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)})`)
    .join('\n');

  const itemsRowsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${escapeHtml(item.name)}${item.variant ? ` (${escapeHtml(item.variant)})` : ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:center;">${Number(item.quantity || 1)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a;text-align:right;">$${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const subject = `Order Confirmed: ${orderId} — TechTonic Store`;
  const text = [
    `Hello ${customerName},`,
    '',
    `Thank you for your order at TechTonic Store!`,
    `Order ID: ${orderId}`,
    `Payment Method: ${order.paymentMethod || 'Bakong KHQR'} (${order.paymentStatus || 'Paid'})`,
    `Total: $${total}`,
    '',
    'Items:',
    itemsListText,
    '',
    `Track your order live: ${trackUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
      <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Order Confirmed</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;">Hello ${escapeHtml(customerName)}, thank you for shopping with TechTonic Store Cambodia.</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:13px;">
          <div><strong>Order ID:</strong> ${escapeHtml(orderId)}</div>
          <div><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || 'Bakong KHQR')} (${escapeHtml(order.paymentStatus || 'Paid')})</div>
          <div><strong>Total Paid:</strong> $${total}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#f8fafc;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;">
              <th style="padding:8px 12px;">Product</th>
              <th style="padding:8px 12px;text-align:center;">Qty</th>
              <th style="padding:8px 12px;text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsRowsHtml}</tbody>
        </table>
        <a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 20px;border-radius:10px;">Track Your Order Live</a>
      </div>
    </div>`;

  return sendTransactionalEmail({
    to,
    subject,
    text,
    html,
    type: 'ORDER_CONFIRMATION',
    refId: orderId,
  });
}

export async function sendOrderStatusEmail(order, previousStatus = '') {
  const to = order?.shippingAddress?.email || order?.customer?.email || order?.customerEmail;
  if (!to) return { delivered: false, status: 'SKIPPED_NO_EMAIL' };

  const orderId = order.id;
  const customerName = order.shippingAddress?.fullName || order.customer?.fullName || 'Customer';
  const nextStatus = order.status || 'Updated';
  const trackUrl = `${getFrontendBaseUrl()}/orders/${encodeURIComponent(orderId)}`;
  const subject = `Order ${orderId} Update: ${nextStatus} — TechTonic Store`;

  const text = [
    `Hello ${customerName},`,
    '',
    `Your order ${orderId} status has been updated${previousStatus ? ` from "${previousStatus}"` : ''} to "${nextStatus}".`,
    order?.tracking?.courier ? `Courier: ${order.tracking.courier}` : '',
    order?.tracking?.trackingCode ? `Tracking Code: ${order.tracking.trackingCode}` : '',
    '',
    `View live progress: ${trackUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
      <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Order Status Updated</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;">Hello ${escapeHtml(customerName)}, your order <strong>${escapeHtml(orderId)}</strong> is now <strong>${escapeHtml(nextStatus)}</strong>.</p>
        <a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 20px;border-radius:10px;">View Live Tracking</a>
      </div>
    </div>`;

  return sendTransactionalEmail({
    to,
    subject,
    text,
    html,
    type: 'ORDER_STATUS_UPDATE',
    refId: orderId,
  });
}

export async function sendNewsletterWelcomeEmail(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return { delivered: false, status: 'SKIPPED_NO_EMAIL' };

  const subject = 'Welcome to TechTonic Store Dispatch!';
  const text = [
    'Welcome to TechTonic Store Cambodia!',
    '',
    'You are now subscribed to product launches, switch/audio restocks, and exclusive member promo codes.',
    `Visit Store: ${getFrontendBaseUrl()}/shop`,
  ].join('\n');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
      <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Subscribed to TechTonic Dispatch</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;">Thank you for subscribing! You will receive updates on flagship hardware arrivals and exclusive discounts.</p>
        <a href="${escapeHtml(getFrontendBaseUrl())}/shop" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 20px;border-radius:10px;">Explore Catalog</a>
      </div>
    </div>`;

  return sendTransactionalEmail({
    to: cleanEmail,
    subject,
    text,
    html,
    type: 'NEWSLETTER_WELCOME',
    refId: cleanEmail,
  });
}

