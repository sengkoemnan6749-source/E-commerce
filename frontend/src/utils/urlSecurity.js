/**
 * Ensures external anchor links use only safe http/https schemes (blocks javascript:, data:, vbscript:).
 */
export function toSafeExternalUrl(rawUrl, fallback = 'https://vireakbuntham.com/') {
  const candidate = String(rawUrl || '').trim();
  if (!candidate) return fallback;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Invalid URL -> fall back safely
  }
  return fallback;
}

/**
 * Ensures post-auth redirect targets are strictly internal relative paths (blocks open redirects like //evil.example).
 */
export function sanitizeInternalRedirect(rawPath, fallback = null) {
  const s = String(rawPath || '').trim();
  if (!s) return fallback;
  if (/^\/(?!\/|\\)[\w\-/?=&%.#]*$/.test(s)) {
    return s;
  }
  return fallback;
}
