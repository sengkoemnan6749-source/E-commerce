/**
 * Application error with HTTP status code and machine-readable error code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req, res) {
  const safePath = String(req.originalUrl || '').slice(0, 120);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${safePath}`,
    code: 'NOT_FOUND',
  });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const isProd = process.env.NODE_ENV === 'production';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[API Error] ${req.method} ${req.originalUrl} -> ${statusCode}:`, err.message);
  }

  const publicMessage =
    statusCode >= 500 && isProd ? 'Internal server error' : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: publicMessage,
    code,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

