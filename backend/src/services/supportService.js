import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { getClientIp, recordAuditEvent } from './auditService.js';
import { notifySupportTicket } from './telegramService.js';

const VALID_TOPICS = new Set(['order', 'warranty', 'product', 'payment', 'other']);
const VALID_STATUSES = new Set(['open', 'in_progress', 'resolved']);

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function cleanText(value, maxLen) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function generateTicketId() {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TT-SUP-${rand}`;
}

/**
 * Creates a customer support inquiry ticket in Firestore with input sanitization.
 */
export async function createSupportTicket(req, payload = {}) {
  const firestore = ensureDb();

  const name = cleanText(payload.name, 80);
  const contact = cleanText(payload.contact, 120);
  const message = String(payload.message ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1500);
  const orderCode = cleanText(payload.orderCode, 40);
  const rawTopic = String(payload.topic || 'other').trim().toLowerCase();
  const topic = VALID_TOPICS.has(rawTopic) ? rawTopic : 'other';

  if (name.length < 2) {
    throw new AppError('Please enter your name (at least 2 characters).', 400, 'VALIDATION_ERROR');
  }
  if (contact.length < 3) {
    throw new AppError('Please enter your phone number, Telegram username, or email.', 400, 'VALIDATION_ERROR');
  }
  if (message.length < 5) {
    throw new AppError('Please enter a brief message (at least 5 characters).', 400, 'VALIDATION_ERROR');
  }

  const id = generateTicketId();
  const nowIso = new Date().toISOString();

  const ticket = {
    id,
    name,
    contact,
    topic,
    orderCode: orderCode || '',
    message,
    status: 'open',
    adminNote: '',
    uid: req.user?.uid || null,
    userEmail: req.user?.email || null,
    clientIp: getClientIp(req),
    createdAt: nowIso,
    updatedAt: nowIso,
    serverUpdatedAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection('supportTickets').doc(id).set(ticket);

  await recordAuditEvent(req, {
    eventType: 'SUPPORT_TICKET_CREATED',
    severity: 'info',
    targetType: 'support_ticket',
    targetId: id,
    status: 'SUCCESS',
    details: `Support inquiry (${topic}) from ${name} (${contact})`,
  });

  const result = {
    id: ticket.id,
    name: ticket.name,
    contact: ticket.contact,
    topic: ticket.topic,
    orderCode: ticket.orderCode,
    message: ticket.message,
    status: ticket.status,
    createdAt: ticket.createdAt,
  };

  const tgPromise = notifySupportTicket(result);
  if (process.env.VERCEL === '1') {
    await Promise.race([tgPromise, new Promise((r) => setTimeout(r, 2500))]);
  }

  return result;
}

/**
 * Lists customer support inquiries for the Admin Support Inbox.
 */
export async function listSupportTickets({ status = '', limit = 100 } = {}) {
  const firestore = ensureDb();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 250);
  const snap = await firestore
    .collection('supportTickets')
    .orderBy('createdAt', 'desc')
    .limit(safeLimit)
    .get();

  const all = snap.docs.map((doc) => {
    const d = doc.data() || {};
    return {
      id: d.id || doc.id,
      name: d.name || '',
      contact: d.contact || '',
      topic: d.topic || 'other',
      orderCode: d.orderCode || '',
      message: d.message || '',
      status: d.status || 'open',
      adminNote: d.adminNote || '',
      uid: d.uid || null,
      userEmail: d.userEmail || null,
      createdAt: d.createdAt || null,
      updatedAt: d.updatedAt || null,
    };
  });

  const cleanStatus = String(status || '').trim().toLowerCase();
  const items =
    cleanStatus && VALID_STATUSES.has(cleanStatus)
      ? all.filter((item) => item.status === cleanStatus)
      : all;

  const openCount = all.filter((item) => item.status === 'open').length;

  return {
    items,
    openCount,
    total: all.length,
  };
}

/**
 * Updates ticket status or internal note from the Admin Support Inbox.
 */
export async function updateSupportTicketStatus(req, ticketId, payload = {}) {
  const firestore = ensureDb();
  const cleanId = cleanText(ticketId, 60);
  if (!cleanId) {
    throw new AppError('Ticket ID is required', 400, 'VALIDATION_ERROR');
  }

  const ref = firestore.collection('supportTickets').doc(cleanId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new AppError('Support ticket not found', 404, 'NOT_FOUND');
  }

  const updates = {
    updatedAt: new Date().toISOString(),
    serverUpdatedAt: FieldValue.serverTimestamp(),
  };

  if (payload.status !== undefined) {
    const nextStatus = String(payload.status || '').trim().toLowerCase();
    if (!VALID_STATUSES.has(nextStatus)) {
      throw new AppError('Invalid ticket status', 400, 'VALIDATION_ERROR');
    }
    updates.status = nextStatus;
  }

  if (typeof payload.adminNote === 'string') {
    updates.adminNote = payload.adminNote.replace(/[<>]/g, '').trim().slice(0, 500);
  }

  await ref.set(updates, { merge: true });

  await recordAuditEvent(req, {
    eventType: 'SUPPORT_TICKET_UPDATED',
    severity: 'info',
    targetType: 'support_ticket',
    targetId: cleanId,
    status: 'SUCCESS',
    details: `Support ticket ${cleanId} updated (status=${updates.status || snap.data()?.status})`,
  });

  const updatedSnap = await ref.get();
  return updatedSnap.data();
}

