import { firebaseAuth, isFirebaseConfigured } from '../config/firebase';

const TOKEN_KEY = 'techtonic_firebase_token';
const ADMIN_VAULT_KEY = 'techtonic_admin_vault';
const USER_2FA_KEY = 'techtonic_user_2fa';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

let activeTokenRefresh = null;

async function refreshFirebaseToken() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    return null;
  }
  if (!activeTokenRefresh) {
    activeTokenRefresh = (async () => {
      try {
        if (typeof firebaseAuth.authStateReady === 'function') {
          await firebaseAuth.authStateReady();
        }
        if (firebaseAuth.currentUser) {
          const freshToken = await firebaseAuth.currentUser.getIdToken(true);
          setAuthToken(freshToken);
          return freshToken;
        }
        setAuthToken(null);
        return null;
      } catch {
        return null;
      } finally {
        activeTokenRefresh = null;
      }
    })();
  }
  return activeTokenRefresh;
}

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getAdminVaultToken() {
  try {
    return sessionStorage.getItem(ADMIN_VAULT_KEY) || null;
  } catch {
    return null;
  }
}

export function setAdminVaultToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_VAULT_KEY, token);
    } else {
      sessionStorage.removeItem(ADMIN_VAULT_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getUser2faToken() {
  try {
    return sessionStorage.getItem(USER_2FA_KEY) || null;
  } catch {
    return null;
  }
}

export function setUser2faToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(USER_2FA_KEY, token);
    } else {
      sessionStorage.removeItem(USER_2FA_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

const VAULT_LOCK_CODES = new Set([
  'VAULT_SETUP_REQUIRED',
  'ADMIN_VAULT_LOCKED',
  'VAULT_EXPIRED',
  'VAULT_REVOKED',
  'ADMIN_DEVICE_MISMATCH',
  'INVALID_VAULT_SIGNATURE',
  'INVALID_VAULT_PAYLOAD',
  'VAULT_UID_MISMATCH',
  'MISSING_VAULT_TOKEN',
]);

async function request(path, options = {}) {
  const url = path.startsWith('http')
    ? path
    : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const token = getAuthToken();
  const vaultToken = path.startsWith('/admin') ? getAdminVaultToken() : null;
  const user2faToken = getUser2faToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(vaultToken ? { 'x-admin-vault': vaultToken } : {}),
    ...(user2faToken ? { 'x-user-2fa': user2faToken } : {}),
    ...(options.headers || {}),
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? window.setTimeout(() => controller.abort(), 15000) : null;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller?.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('Server request timed out. Please try again.');
      timeoutErr.code = 'REQUEST_TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      !options._retried &&
      (json?.code === 'TOKEN_EXPIRED' || json?.code === 'INVALID_TOKEN' || json?.code === 'AUTH_REQUIRED')
    ) {
      const freshToken = await refreshFirebaseToken();
      if (freshToken && freshToken !== token) {
        return request(path, { ...options, _retried: true });
      }
      if (!freshToken && token && path.startsWith('/orders/')) {
        return request(path, { ...options, _retried: true });
      }
    }
    if (
      path.startsWith('/admin') &&
      !path.startsWith('/admin/vault') &&
      VAULT_LOCK_CODES.has(json?.code)
    ) {
      setAdminVaultToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('techtonic:admin-vault-locked', {
            detail: { code: json.code, message: json.error },
          })
        );
      }
    }
    const err = new Error(json?.error || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.code = json?.code || 'API_ERROR';
    err.payload = json;
    throw err;
  }

  return json;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path, body, options) =>
    request(path, { ...options, method: 'PUT', body: JSON.stringify(body ?? {}) }),
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  getAuthToken,
  setAuthToken,
  getAdminVaultToken,
  setAdminVaultToken,
  getUser2faToken,
  setUser2faToken,
};

export default api;
