import { FieldValue } from 'firebase-admin/firestore';
import { auth, db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

function ensureDb() {
  if (!db) {
    throw new AppError('Database is not initialized', 503, 'DB_UNAVAILABLE');
  }
  return db;
}

function formatMemberSince(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function serializeAddressDoc(doc) {
  return { id: doc.id, ...doc.data() };
}

/**
 * Fetches all saved addresses for a user, default address first.
 */
export async function listAddresses(uid) {
  const firestore = ensureDb();
  const snapshot = await firestore.collection('users').doc(uid).collection('addresses').get();
  const addresses = snapshot.docs.map(serializeAddressDoc);

  addresses.sort((a, b) => {
    const defDiff = Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault));
    if (defDiff !== 0) return defDiff;
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  });

  return addresses;
}

function canonicalizeGmail(email = '') {
  const clean = String(email || '').trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) return '';
  const [local, domain] = parts;
  if (domain !== 'gmail.com') return '';
  return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`;
}

/**
 * Validates that a new registration email is strictly a non-alias @gmail.com and has no dot-alias collision.
 */
export async function validateRegistrationEmail(rawEmail = '') {
  const clean = String(rawEmail || '').trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AppError('Please enter a valid email address.', 400, 'INVALID_EMAIL');
  }

  const [localPart, domain] = parts;
  if (domain !== 'gmail.com') {
    throw new AppError('Only @gmail.com email addresses are allowed for registration.', 400, 'GMAIL_ONLY');
  }

  if (localPart.includes('+')) {
    throw new AppError('Alias emails with "+" are not allowed. Please use your primary Gmail address.', 400, 'ALIAS_NOT_ALLOWED');
  }

  if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/.test(localPart) || localPart.length < 3 || localPart.length > 64) {
    throw new AppError('Invalid Gmail address format.', 400, 'INVALID_GMAIL_LOCAL');
  }

  const canonical = canonicalizeGmail(clean);
  const firestore = ensureDb();
  const [byCanonical, byExact] = await Promise.all([
    firestore.collection('users').where('canonicalEmail', '==', canonical).limit(1).get(),
    firestore.collection('users').where('email', '==', clean).limit(1).get(),
  ]);

  if (!byCanonical.empty || !byExact.empty) {
    throw new AppError(
      'Unable to complete registration with this email address. Please sign in or try another Gmail.',
      400,
      'REGISTRATION_NOT_ALLOWED'
    );
  }

  return { valid: true };
}

/**
 * Loads the Firestore profile for an authenticated Firebase user, creating it on first sign-in.
 */
export async function getOrCreateUserProfile(firebaseUser) {
  const firestore = ensureDb();
  const userRef = firestore.collection('users').doc(firebaseUser.uid);

  const [userSnap, savedAddresses] = await Promise.all([
    userRef.get(),
    listAddresses(firebaseUser.uid),
  ]);

  if (userSnap.exists) {
    const existing = userSnap.data();
    const resolvedRole = firebaseUser.role === 'admin' ? 'admin' : (existing.role || 'customer');
    if (resolvedRole !== existing.role) {
      await userRef.update({
        role: resolvedRole,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return {
      id: userSnap.id,
      ...existing,
      role: resolvedRole,
      savedAddresses,
    };
  }

  const displayName =
    firebaseUser.name ||
    (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'TechTonic Customer');

  const nowIso = new Date().toISOString();
  const newProfile = {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    name: displayName,
    fullName: displayName,
    email: firebaseUser.email || '',
    canonicalEmail: canonicalizeGmail(firebaseUser.email || '') || null,
    phone: '',
    avatar: firebaseUser.picture || '/images/avatars/sara.png',
    role: firebaseUser.role || 'customer',
    status: 'Active',
    preferredLanguage: 'en',
    ordersCount: 0,
    totalSpent: 0,
    memberSince: formatMemberSince(new Date()),
    createdAt: nowIso,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await userRef.set(newProfile);

  import('./auditService.js')
    .then(({ recordAuditEvent }) =>
      recordAuditEvent({
        eventType: 'ACCOUNT_CREATED',
        severity: 'info',
        actorUid: firebaseUser.uid,
        actorEmail: newProfile.email,
        actorRole: newProfile.role,
        targetType: 'user',
        targetId: firebaseUser.uid,
        status: 'SUCCESS',
        details: `Registered new user profile (${newProfile.email || firebaseUser.uid})`,
      })
    )
    .catch(() => {});

  return {
    ...newProfile,
    updatedAt: nowIso,
    savedAddresses,
  };
}

function sanitizeAvatarInput(rawAvatar) {
  if (rawAvatar === null || rawAvatar === '') {
    return '';
  }
  if (typeof rawAvatar !== 'string') {
    throw new AppError('Invalid profile image format', 400, 'INVALID_AVATAR');
  }
  const trimmed = rawAvatar.trim();
  if (!trimmed) return '';

  const isSafeDataImage = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed);
  if (isSafeDataImage) {
    if (trimmed.length > 450000) {
      throw new AppError('Profile image is too large. Please upload a smaller image.', 400, 'AVATAR_TOO_LARGE');
    }
    return trimmed;
  }

  const isHttpsUrl = /^https:\/\/[^\s<>"']+$/i.test(trimmed) && trimmed.length <= 1000;
  const isLocalImage = /^\/images\/[A-Za-z0-9/_\-.]+$/i.test(trimmed) && trimmed.length <= 300;
  if (isHttpsUrl || isLocalImage) {
    return trimmed;
  }

  throw new AppError('Unsupported profile image format', 400, 'INVALID_AVATAR');
}

const MAX_SAVED_ADDRESSES = 20;

function cleanUserField(val, maxLen = 120) {
  return String(val ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Updates whitelisted profile fields for the authenticated user.
 */
export async function updateUserProfile(firebaseUser, payload = {}) {
  const firestore = ensureDb();
  await getOrCreateUserProfile(firebaseUser);

  const userRef = firestore.collection('users').doc(firebaseUser.uid);
  const updates = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  const nextName = payload.fullName ?? payload.name;
  if (typeof nextName === 'string' && nextName.trim()) {
    const cleanName = cleanUserField(nextName, 80);
    if (cleanName) {
      updates.fullName = cleanName;
      updates.name = cleanName;
    }
  }

  if (typeof payload.phone === 'string') {
    updates.phone = cleanUserField(payload.phone, 32);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'avatar')) {
    updates.avatar = sanitizeAvatarInput(payload.avatar);
  }

  if (payload.preferredLanguage === 'en' || payload.preferredLanguage === 'km') {
    updates.preferredLanguage = payload.preferredLanguage;
  }

  await userRef.set(updates, { merge: true });

  if (auth && (updates.name || (typeof updates.avatar === 'string' && updates.avatar.startsWith('https://')))) {
    try {
      const authPatch = {};
      if (updates.name) authPatch.displayName = updates.name;
      if (typeof updates.avatar === 'string' && updates.avatar.startsWith('https://')) {
        authPatch.photoURL = updates.avatar;
      }
      await auth.updateUser(firebaseUser.uid, authPatch);
    } catch {
      // Non-fatal if user record isn't in Auth (e.g. unit test)
    }
  }

  return getOrCreateUserProfile(firebaseUser);
}

/**
 * Creates a new saved address under users/{uid}/addresses.
 */
export async function createAddress(uid, payload = {}) {
  const firestore = ensureDb();
  const fullName = cleanUserField(payload.fullName, 80);
  const phone = cleanUserField(payload.phone, 32);
  const address = cleanUserField(payload.address, 200);
  const city = cleanUserField(payload.city, 80);

  if (!fullName || !phone || !address || !city) {
    throw new AppError(
      'fullName, phone, address, and city are required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const addressesRef = firestore.collection('users').doc(uid).collection('addresses');
  const existingSnap = await addressesRef.get();
  if (existingSnap.size >= MAX_SAVED_ADDRESSES) {
    throw new AppError(
      `Maximum of ${MAX_SAVED_ADDRESSES} saved addresses reached. Please remove an older address first.`,
      400,
      'ADDRESS_LIMIT_EXCEEDED'
    );
  }
  const shouldBeDefault = Boolean(payload.isDefault) || existingSnap.empty;

  const batch = firestore.batch();
  if (shouldBeDefault && !existingSnap.empty) {
    existingSnap.docs.forEach((doc) => {
      if (doc.data()?.isDefault) {
        batch.update(doc.ref, { isDefault: false });
      }
    });
  }

  const newRef = addressesRef.doc();
  const nowIso = new Date().toISOString();
  const record = {
    id: newRef.id,
    title: cleanUserField(payload.title || 'Delivery Address', 60) || 'Delivery Address',
    isDefault: shouldBeDefault,
    fullName,
    phone,
    address,
    city,
    province: cleanUserField(payload.province || 'Phnom Penh', 80) || 'Phnom Penh',
    postalCode: cleanUserField(payload.postalCode || '12000', 20) || '12000',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  batch.set(newRef, record);
  await batch.commit();

  import('./auditService.js')
    .then(({ recordAuditEvent }) =>
      recordAuditEvent({
        eventType: 'ADDRESS_CREATED',
        severity: 'info',
        actorUid: uid,
        targetType: 'address',
        targetId: newRef.id,
        status: 'SUCCESS',
        details: `Created shipping address (${city})`,
      })
    )
    .catch(() => {});

  return record;
}

/**
 * Updates an existing saved address under users/{uid}/addresses/{addressId}.
 */
export async function updateAddress(uid, addressId, payload = {}) {
  const firestore = ensureDb();
  const addressesRef = firestore.collection('users').doc(uid).collection('addresses');
  const targetRef = addressesRef.doc(String(addressId).trim());
  const targetSnap = await targetRef.get();

  if (!targetSnap.exists) {
    throw new AppError(`Address not found: ${addressId}`, 404, 'ADDRESS_NOT_FOUND');
  }

  const batch = firestore.batch();
  if (payload.isDefault === true) {
    const allSnap = await addressesRef.get();
    allSnap.docs.forEach((doc) => {
      if (doc.id !== targetRef.id && doc.data()?.isDefault) {
        batch.update(doc.ref, { isDefault: false });
      }
    });
  }

  const fieldMaxLens = {
    title: 60,
    fullName: 80,
    phone: 32,
    address: 200,
    city: 80,
    province: 80,
    postalCode: 20,
  };

  const updates = { updatedAt: new Date().toISOString() };
  if (payload.isDefault !== undefined) {
    updates.isDefault = Boolean(payload.isDefault);
  }
  for (const [key, maxLen] of Object.entries(fieldMaxLens)) {
    if (typeof payload[key] === 'string') {
      updates[key] = cleanUserField(payload[key], maxLen);
    }
  }

  batch.set(targetRef, updates, { merge: true });
  await batch.commit();

  const updatedSnap = await targetRef.get();
  return serializeAddressDoc(updatedSnap);
}

/**
 * Deletes a saved address; promotes another address as default if the deleted one was default.
 */
export async function deleteAddress(uid, addressId) {
  const firestore = ensureDb();
  const addressesRef = firestore.collection('users').doc(uid).collection('addresses');
  const targetRef = addressesRef.doc(String(addressId).trim());
  const targetSnap = await targetRef.get();

  if (!targetSnap.exists) {
    throw new AppError(`Address not found: ${addressId}`, 404, 'ADDRESS_NOT_FOUND');
  }

  const wasDefault = Boolean(targetSnap.data()?.isDefault);
  await targetRef.delete();

  import('./auditService.js')
    .then(({ recordAuditEvent }) =>
      recordAuditEvent({
        eventType: 'ADDRESS_DELETED',
        severity: 'info',
        actorUid: uid,
        targetType: 'address',
        targetId: targetRef.id,
        status: 'SUCCESS',
        details: 'Deleted shipping address',
      })
    )
    .catch(() => {});

  if (wasDefault) {
    const remaining = await addressesRef.limit(1).get();
    if (!remaining.empty) {
      await remaining.docs[0].ref.update({ isDefault: true });
    }
  }

  return { deletedId: targetRef.id };
}

function sanitizeSyncImage(raw) {
  if (typeof raw !== 'string') return '';
  const clean = raw.trim().slice(0, 500);
  if (/^\/images\/[A-Za-z0-9/_\-.]+$/.test(clean)) return clean;
  if (/^https?:\/\/[^\s<>"'`]+$/i.test(clean)) return clean;
  return '';
}

function sanitizeSyncItems(items, mode = 'cart') {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.id)
    .slice(0, 50)
    .map((item) => {
      const base = {
        id: cleanUserField(item.id, 120),
        name: cleanUserField(item.name, 180),
        price: Number(item.price) || 0,
        image: sanitizeSyncImage(item.image),
        category: cleanUserField(item.category, 80),
      };
      if (mode === 'cart') {
        const variant = cleanUserField(item.variant || item.selectedVariant || 'Standard', 80) || 'Standard';
        return {
          ...base,
          variant,
          selectedVariant: variant,
          quantity: Math.max(1, Math.min(99, Math.round(Number(item.quantity) || 1))),
        };
      }
      return base;
    });
}

/**
 * Persists authenticated user's cart and wishlist into Firestore for cross-device sync.
 */
export async function syncUserState(firebaseUser, payload = {}) {
  const firestore = ensureDb();
  await getOrCreateUserProfile(firebaseUser);
  const userRef = firestore.collection('users').doc(firebaseUser.uid);

  const updates = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (Array.isArray(payload.cart)) {
    updates.cart = sanitizeSyncItems(payload.cart, 'cart');
  }
  if (Array.isArray(payload.wishlist)) {
    updates.wishlist = sanitizeSyncItems(payload.wishlist, 'wishlist');
  }

  await userRef.set(updates, { merge: true });
  return {
    cart: updates.cart,
    wishlist: updates.wishlist,
  };
}

