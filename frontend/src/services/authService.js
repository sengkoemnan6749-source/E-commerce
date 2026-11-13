import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { firebaseAuth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { api } from './api';
import { sanitizeDisplayName, validateRegistrationGmail, validateStrongPassword } from '../utils/validation';

const USER_KEY = 'techtonic_user';
const LOGGED_OUT_KEY = 'techtonic_logged_out';

function getStoredUser() {
  try {
    if (localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredUser(user) {
  try {
    if (user) {
      localStorage.removeItem(LOGGED_OUT_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.setItem(LOGGED_OUT_KEY, 'true');
    }
  } catch (e) {
    console.error('Failed to save user:', e);
  }
}

function ensureFirebaseReady() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Firebase authentication is not configured.');
  }
}

export const authService = {
  getCurrentUser() {
    return getStoredUser();
  },

  reportSecurityEvent(eventType, details = '', email = null) {
    try {
      api
        .post('/auth/audit', {
          eventType,
          details,
          email: email ? String(email).trim().slice(0, 120) : null,
        })
        .catch(() => {});
    } catch {
      // Non-blocking audit telemetry
    }
  },

  logout() {
    const current = getStoredUser();
    this.reportSecurityEvent('LOGOUT', 'User signed out', current?.email || null);
    api.setAuthToken(null);
    api.setAdminVaultToken?.(null);
    api.setUser2faToken?.(null);
    if (isFirebaseConfigured && firebaseAuth) {
      signOut(firebaseAuth).catch(() => {});
    }
    saveStoredUser(null);
  },

  getSignInSecurityInfo() {
    const fbUser = firebaseAuth?.currentUser;
    const providerIds = Array.isArray(fbUser?.providerData)
      ? fbUser.providerData.map((p) => p.providerId)
      : [];
    return {
      hasPassword: providerIds.includes('password'),
      hasGoogle: providerIds.includes('google.com'),
      email: fbUser?.email || getStoredUser()?.email || '',
    };
  },

  async getTwoFactorStatus() {
    try {
      const res = await api.get('/auth/2fa/status');
      return res?.data || { enabled: false, verified: true, remainingRecoveryCodes: 0 };
    } catch {
      return { enabled: false, verified: true, remainingRecoveryCodes: 0 };
    }
  },

  async beginTwoFactorSetup() {
    const res = await api.post('/auth/2fa/setup/begin', {});
    return res?.data || null;
  },

  async confirmTwoFactorSetup(totpCode) {
    const res = await api.post('/auth/2fa/setup/confirm', { totpCode });
    if (res?.data?.twoFactorToken) {
      api.setUser2faToken(res.data.twoFactorToken);
    }
    return res?.data || null;
  },

  async verifyTwoFactor({ totpCode, recoveryCode }) {
    const res = await api.post('/auth/2fa/verify', { totpCode, recoveryCode });
    if (res?.data?.twoFactorToken) {
      api.setUser2faToken(res.data.twoFactorToken);
    }
    return res?.data || null;
  },

  async disableTwoFactor({ totpCode, recoveryCode }) {
    const res = await api.post('/auth/2fa/disable', { totpCode, recoveryCode });
    api.setUser2faToken(null);
    return res?.data || { enabled: false };
  },

  async sendPasswordReset(email) {
    ensureFirebaseReady();
    const cleanEmail = String(email || '').trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address first.');
    }
    await sendPasswordResetEmail(firebaseAuth, cleanEmail);
    this.reportSecurityEvent('PASSWORD_RESET_REQUESTED', 'Password reset email sent', cleanEmail);
    return true;
  },

  async changeOrSetPassword({ currentPassword, newPassword }) {
    ensureFirebaseReady();
    const fbUser = firebaseAuth.currentUser;
    if (!fbUser) {
      throw new Error('Please sign in again to change your password.');
    }
    const email = fbUser.email || '';
    const pwCheck = validateStrongPassword(newPassword, email, fbUser.displayName || '');
    if (!pwCheck.valid) {
      throw new Error(
        'Password must be at least 8 characters with uppercase, lowercase, number, special character, and must not be common or contain your name/email.'
      );
    }

    const { hasPassword } = this.getSignInSecurityInfo();
    if (hasPassword) {
      if (!currentPassword) {
        throw new Error('Current password is required.');
      }
      const cred = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(fbUser, cred);
      await updatePassword(fbUser, newPassword);
      this.reportSecurityEvent('PASSWORD_CHANGED', 'User changed account password', email);
      return { mode: 'changed' };
    }

    const newCred = EmailAuthProvider.credential(email, newPassword);
    try {
      await linkWithCredential(fbUser, newCred);
    } catch (err) {
      if (err?.code === 'auth/requires-recent-login' && googleProvider) {
        await reauthenticateWithPopup(fbUser, googleProvider);
        await linkWithCredential(fbUser, newCred);
      } else {
        throw err;
      }
    }
    this.reportSecurityEvent('PASSWORD_SET', 'Google account linked an email/password credential', email);
    return { mode: 'set' };
  },

  async syncBackendProfile() {
    const res = await api.get('/auth/me');
    if (res?.data) {
      saveStoredUser(res.data);
      return res.data;
    }
    return null;
  },

  async loginWithEmail(email, password) {
    ensureFirebaseReady();
    const cleanEmail = email.trim();
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      const idToken = await credential.user.getIdToken();
      api.setAuthToken(idToken);
      const twoFactor = await this.getTwoFactorStatus();
      if (twoFactor.enabled && !twoFactor.verified) {
        return { requires2fa: true, email: credential.user.email || cleanEmail };
      }
      const profile = await this.syncBackendProfile();
      if (!profile) {
        throw new Error('Unable to load user profile from server.');
      }
      this.reportSecurityEvent('LOGIN_SUCCESS', 'Signed in with email and password', profile.email || cleanEmail);
      return { requires2fa: false, profile };
    } catch (err) {
      this.reportSecurityEvent('LOGIN_FAILED', err?.code || err?.message || 'Sign-in rejected', cleanEmail);
      throw err;
    }
  },

  async registerWithEmail(userData) {
    ensureFirebaseReady();
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const displayName = sanitizeDisplayName(userData.fullName || userData.name || 'TechTonic Customer') || 'TechTonic Customer';

    const gmailCheck = validateRegistrationGmail(cleanEmail);
    if (!gmailCheck.valid) {
      this.reportSecurityEvent('REGISTER_FAILED', `Registration email rejected (${gmailCheck.reasonCode})`, cleanEmail);
      throw new Error(
        gmailCheck.reasonCode === 'ALIAS_NOT_ALLOWED'
          ? 'Alias emails (+tag) are not allowed. Please use your primary @gmail.com address.'
          : 'Only standard @gmail.com email addresses are allowed for creating an account.'
      );
    }

    const pwCheck = validateStrongPassword(userData.password, cleanEmail, displayName);
    if (!pwCheck.valid) {
      this.reportSecurityEvent('REGISTER_FAILED', `Weak password rejected (${pwCheck.reasonCode})`, cleanEmail);
      throw new Error(
        'Password must be at least 8 characters with uppercase, lowercase, number, special character, and must not be common or contain your name/email.'
      );
    }

    await api.post('/auth/check-registration-email', { email: cleanEmail });

    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        cleanEmail,
        userData.password
      );
      await updateFirebaseProfile(credential.user, { displayName });
      const idToken = await credential.user.getIdToken(true);
      api.setAuthToken(idToken);

      const res = await api.put('/auth/profile', {
        fullName: displayName,
        name: displayName,
        phone: userData.phone || '',
      });
      if (res?.data) {
        saveStoredUser(res.data);
        this.reportSecurityEvent('REGISTER_SUCCESS', 'Created new customer account', res.data.email || cleanEmail);
        return res.data;
      }
      const synced = await this.syncBackendProfile();
      this.reportSecurityEvent('REGISTER_SUCCESS', 'Created new customer account', synced?.email || cleanEmail);
      return synced;
    } catch (err) {
      this.reportSecurityEvent('REGISTER_FAILED', err?.code || err?.message || 'Registration failed', cleanEmail);
      throw err;
    }
  },

  async loginWithGoogle() {
    ensureFirebaseReady();
    if (!googleProvider) {
      throw new Error('Google sign-in provider is not configured.');
    }
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await credential.user.getIdToken();
      api.setAuthToken(idToken);
      const twoFactor = await this.getTwoFactorStatus();
      if (twoFactor.enabled && !twoFactor.verified) {
        return { requires2fa: true, email: credential.user.email || '' };
      }
      const profile = await this.syncBackendProfile();
      if (!profile) {
        throw new Error('Unable to load user profile from server.');
      }
      this.reportSecurityEvent('LOGIN_SUCCESS', 'Signed in via Google OAuth', profile.email);
      return { requires2fa: false, profile };
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        this.reportSecurityEvent('LOGIN_FAILED', err?.code || err?.message || 'Google sign-in failed');
      }
      throw err;
    }
  },

  async updateProfile(updatedData) {
    const current = getStoredUser();
    if (!current || !api.getAuthToken()) {
      throw new Error('Please sign in to update your profile.');
    }
    const res = await api.put('/auth/profile', updatedData);
    if (res?.data) {
      saveStoredUser(res.data);
      return res.data;
    }
    const merged = { ...current, ...updatedData };
    saveStoredUser(merged);
    return merged;
  },

  async saveAddress(newAddr) {
    if (!api.getAuthToken()) {
      throw new Error('Please sign in to save shipping addresses.');
    }
    const res = await api.post('/addresses', newAddr);
    const current = getStoredUser();
    if (res?.data && current) {
      const updatedUser = {
        ...current,
        savedAddresses: Array.isArray(res.data)
          ? res.data
          : res.data.savedAddresses || current.savedAddresses || [],
      };
      saveStoredUser(updatedUser);
      return updatedUser;
    }
    return this.syncBackendProfile();
  },

  async deleteAddress(addrId) {
    if (!api.getAuthToken()) {
      throw new Error('Please sign in to manage addresses.');
    }
    const res = await api.delete(`/addresses/${encodeURIComponent(addrId)}`);
    const current = getStoredUser();
    if (res?.data && current) {
      const updatedUser = {
        ...current,
        savedAddresses: Array.isArray(res.data)
          ? res.data
          : res.data.savedAddresses || (current.savedAddresses || []).filter(a => a.id !== addrId),
      };
      saveStoredUser(updatedUser);
      return updatedUser;
    }
    return this.syncBackendProfile();
  },

  async setDefaultAddress(addrId) {
    if (!api.getAuthToken()) {
      throw new Error('Please sign in to manage addresses.');
    }
    const res = await api.put(`/addresses/${encodeURIComponent(addrId)}`, { isDefault: true });
    const current = getStoredUser();
    if (res?.data && current) {
      const updatedUser = {
        ...current,
        savedAddresses: Array.isArray(res.data)
          ? res.data
          : res.data.savedAddresses || (current.savedAddresses || []).map(a => ({ ...a, isDefault: a.id === addrId })),
      };
      saveStoredUser(updatedUser);
      return updatedUser;
    }
    return this.syncBackendProfile();
  },
};
