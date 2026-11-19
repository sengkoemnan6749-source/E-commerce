import { auth, db } from '../config/firebase.js';
import { AppError } from './errorHandler.js';
import { recordAuditEvent } from '../services/auditService.js';

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim() || null;
}

async function decodeAndBuildUser(token) {
  if (!auth) {
    throw new AppError('Authentication service is unavailable', 503, 'AUTH_UNAVAILABLE');
  }

  let decoded;
  try {
    // Check revocation state so disabled/revoked sessions are rejected immediately
    decoded = await auth.verifyIdToken(token, true);
  } catch (error) {
    const code =
      error.code === 'auth/id-token-revoked'
        ? 'TOKEN_REVOKED'
        : error.code === 'auth/id-token-expired'
        ? 'TOKEN_EXPIRED'
        : 'INVALID_TOKEN';
    throw new AppError('Invalid or expired authentication token', 401, code);
  }

  const email = (decoded.email || '').toLowerCase();
  const emailVerified = Boolean(decoded.email_verified);
  const isClaimAdmin = decoded.admin === true || decoded.role === 'admin';
  const isEnvAdmin = Boolean(email && emailVerified && getAdminEmails().includes(email));

  let role = isClaimAdmin || isEnvAdmin ? 'admin' : 'customer';

  if (role !== 'admin' && db) {
    try {
      const userDoc = await db.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin' && emailVerified) {
        role = 'admin';
      }
    } catch {
      // Do not fail auth solely due to profile lookup issue; verified ID token stands.
    }
  }

  return {
    uid: decoded.uid,
    email: decoded.email || null,
    name: decoded.name || null,
    picture: decoded.picture || null,
    emailVerified,
    role,
    claims: decoded,
  };
}

/**
 * Requires a valid Firebase ID token in the Authorization: Bearer <token> header.
 */
export async function verifyFirebaseToken(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      if (req.originalUrl?.startsWith('/api/admin')) {
        recordAuditEvent(req, {
          eventType: 'UNAUTHORIZED_ADMIN_ACCESS',
          severity: 'warning',
          status: 'BLOCKED',
          details: 'Unauthenticated request to admin endpoint',
        });
      }
      throw new AppError('Authentication token is required', 401, 'AUTH_REQUIRED');
    }

    req.user = await decodeAndBuildUser(token);
    next();
  } catch (error) {
    if (error?.code === 'INVALID_TOKEN') {
      recordAuditEvent(req, {
        eventType: 'AUTH_TOKEN_REJECTED',
        severity: 'warning',
        status: 'BLOCKED',
        details: `Rejected invalid bearer token on ${req.method} ${req.originalUrl}`,
      });
    }
    next(error);
  }
}

/**
 * Attaches req.user when a valid Bearer token is provided; otherwise continues as guest (req.user = null).
 */
export async function optionalFirebaseToken(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    req.user = await decodeAndBuildUser(token);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Requires an authenticated user with admin privileges.
 */
export function requireAdmin(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication token is required', 401, 'AUTH_REQUIRED'));
  }

  if (req.user.role !== 'admin') {
    recordAuditEvent(req, {
      eventType: 'UNAUTHORIZED_ADMIN_ACCESS',
      severity: 'critical',
      status: 'BLOCKED',
      details: `Non-admin account (${req.user.email || req.user.uid}) attempted admin resource access`,
    });
    return next(new AppError('Admin access is required for this resource', 403, 'FORBIDDEN'));
  }

  return next();
}

