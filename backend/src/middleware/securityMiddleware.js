import { AppError } from './errorHandler.js';
import { recordAuditEvent } from '../services/auditService.js';

const stores = new Map();

/**
 * Sets defensive HTTP response headers against XSS sniffing, clickjacking, and MIME confusion.
 */
export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

function hasDangerousKeys(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return false;
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (typeof obj[key] === 'object' && hasDangerousKeys(obj[key], depth + 1)) {
      return true;
    }
  }
  return false;
}

/**
 * Rejects prototype-pollution attempts or malformed injection keys in query/body payloads.
 */
export function detectSuspiciousRequest(req, _res, next) {
  if (hasDangerousKeys(req.body) || hasDangerousKeys(req.query)) {
    recordAuditEvent(req, {
      eventType: 'SUSPICIOUS_PAYLOAD_BLOCKED',
      severity: 'critical',
      status: 'BLOCKED',
      details: `Blocked dangerous keys in ${req.method} ${req.originalUrl}`,
    });
    return next(new AppError('Malformed or unsafe request payload detected', 400, 'SUSPICIOUS_PAYLOAD'));
  }
  return next();
}

/**
 * In-memory sliding-window IP rate limiter with temporary block & security audit logging.
 */
export function createRateLimiter({
  name = 'api',
  windowMs = 60 * 1000,
  maxRequests = 180,
  blockDurationMs = 5 * 60 * 1000,
} = {}) {
  const bucketMap = new Map();
  stores.set(name, bucketMap);

  return (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    const key = `${name}:${ip}`;
    const now = Date.now();
    let entry = bucketMap.get(key);

    if (entry && entry.blockedUntil && entry.blockedUntil > now) {
      const retrySecs = Math.ceil((entry.blockedUntil - now) / 1000);
      res.setHeader('Retry-After', String(retrySecs));
      return next(
        new AppError(
          `Too many requests. Temporarily blocked for ${retrySecs}s for security.`,
          429,
          'RATE_LIMITED'
        )
      );
    }

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 1, blockedUntil: 0, loggedBlock: false };
      bucketMap.set(key, entry);
      return next();
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      entry.blockedUntil = now + blockDurationMs;
      if (!entry.loggedBlock) {
        entry.loggedBlock = true;
        recordAuditEvent(req, {
          eventType: 'RATE_LIMIT_EXCEEDED',
          severity: 'critical',
          status: 'BLOCKED',
          details: `Rate limit "${name}" exceeded (${entry.count} requests in ${Math.round(windowMs / 1000)}s). Temporarily blocked.`,
        });
      }
      const retrySecs = Math.ceil(blockDurationMs / 1000);
      res.setHeader('Retry-After', String(retrySecs));
      return next(
        new AppError(
          `Too many requests. Temporarily blocked for ${retrySecs}s for security.`,
          429,
          'RATE_LIMITED'
        )
      );
    }

    return next();
  };
}

