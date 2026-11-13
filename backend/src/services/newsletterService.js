import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendNewsletterWelcomeEmail } from './emailService.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Subscribes a visitor email to TechTonic newsletter in Firestore.
 */
export async function subscribeNewsletter(payload = {}, user = null) {
  const firestore = ensureDb();
  const cleanEmail = String(payload.email || '').trim().toLowerCase();

  if (!cleanEmail || !EMAIL_RE.test(cleanEmail) || cleanEmail.length > 160) {
    throw new AppError('Please enter a valid email address', 400, 'VALIDATION_ERROR');
  }

  const language = payload.language === 'km' ? 'km' : 'en';
  const docRef = firestore.collection('newsletterSubscribers').doc(cleanEmail);
  const existing = await docRef.get();
  const nowIso = new Date().toISOString();

  const record = {
    email: cleanEmail,
    status: 'subscribed',
    language,
    userId: user?.uid || existing.data()?.userId || null,
    subscribedAt: existing.exists ? existing.data()?.subscribedAt || nowIso : nowIso,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(record, { merge: true });

  sendNewsletterWelcomeEmail(cleanEmail).catch(() => {});

  return {
    email: cleanEmail,
    status: 'subscribed',
    alreadySubscribed: existing.exists && existing.data()?.status === 'subscribed',
    subscribedAt: record.subscribedAt,
  };
}

