import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';

export function getClientIp(req) {
  if (!req) return 'unknown';
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function getUserAgent(req) {
  const ua = req?.headers?.['user-agent'] || '';
  return String(ua).slice(0, 180);
}

/**
 * Records a security, authentication, order, or administrative audit event in Cloud Firestore.
 */
export async function recordAuditEvent(reqOrMeta = {}, eventData = {}) {
  try {
    if (!db) return null;
    const isReq = Boolean(reqOrMeta && (reqOrMeta.headers || reqOrMeta.originalUrl || reqOrMeta.method));
    const req = isReq ? reqOrMeta : null;
    const data = isReq ? eventData : reqOrMeta;

    const nowIso = new Date().toISOString();
    const id = `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const doc = {
      id,
      eventType: String(data.eventType || 'SECURITY_EVENT').slice(0, 80),
      severity: ['info', 'warning', 'critical'].includes(data.severity) ? data.severity : 'info',
      actorUid: data.actorUid || req?.user?.uid || null,
      actorEmail: data.actorEmail || req?.user?.email || null,
      actorRole: data.actorRole || req?.user?.role || 'guest',
      targetType: data.targetType || null,
      targetId: data.targetId ? String(data.targetId).slice(0, 120) : null,
      ip: data.ip || getClientIp(req),
      userAgent: data.userAgent || getUserAgent(req),
      method: data.method || req?.method || null,
      path: data.path || req?.originalUrl || null,
      status: data.status || 'LOGGED',
      details: data.details ? String(data.details).slice(0, 500) : '',
      createdAt: nowIso,
      serverTimestamp: FieldValue.serverTimestamp(),
    };

    await db.collection('auditLogs').doc(id).set(doc);
    return doc;
  } catch (err) {
    console.error('Audit logging failed (non-fatal):', err?.message || err);
    return null;
  }
}

/**
 * Lists recent security and operational audit logs for Admin inspection.
 */
export async function listAuditLogs(query = {}) {
  if (!db) {
    return { logs: [], summary: { total: 0, criticalCount: 0, warningCount: 0, blockedCount: 0 } };
  }

  const limitNum = Math.min(250, Math.max(1, parseInt(query.limit, 10) || 150));
  const snapshot = await db
    .collection('auditLogs')
    .orderBy('createdAt', 'desc')
    .limit(limitNum)
    .get();

  let logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const summary = {
    total: logs.length,
    criticalCount: logs.filter((l) => l.severity === 'critical').length,
    warningCount: logs.filter((l) => l.severity === 'warning').length,
    blockedCount: logs.filter((l) => String(l.status || '').toUpperCase().includes('BLOCK')).length,
  };

  if (query.severity && String(query.severity).toLowerCase() !== 'all') {
    const targetSev = String(query.severity).toLowerCase();
    logs = logs.filter((l) => l.severity === targetSev);
  }

  if (query.eventType && String(query.eventType).toLowerCase() !== 'all') {
    const targetEv = String(query.eventType).toUpperCase();
    logs = logs.filter((l) => l.eventType === targetEv);
  }

  if (query.search && String(query.search).trim()) {
    const q = String(query.search).trim().toLowerCase();
    logs = logs.filter((l) =>
      [l.id, l.eventType, l.actorEmail, l.actorUid, l.ip, l.targetId, l.path, l.details]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }

  return { logs, summary };
}

