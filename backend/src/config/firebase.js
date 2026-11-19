import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');

function parseServiceAccountRaw(rawInput) {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) {
    throw new Error('Empty service account payload');
  }
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');
  const parsed = JSON.parse(jsonText);
  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

function loadServiceAccount() {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (envJson && String(envJson).trim()) {
    return parseServiceAccountRaw(envJson);
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
  const resolvedPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(BACKEND_ROOT, configuredPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase service account file not found at: ${resolvedPath}`);
  }

  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

let adminApp = null;
let db = null;
let auth = null;
let projectId = null;
let firebaseReady = false;
let firebaseError = null;

try {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    projectId = adminApp.options.projectId || null;
    db = getFirestore(adminApp);
  } else {
    const serviceAccount = loadServiceAccount();
    projectId = serviceAccount.project_id || null;
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    db = getFirestore(adminApp);
    db.settings({ ignoreUndefinedProperties: true });
  }

  auth = getAuth(adminApp);
  firebaseReady = true;
} catch (error) {
  firebaseError = error.message;
  console.error('[Firebase] Initialization warning:', error.message);
}

/**
 * Verifies live Firestore API connectivity using the initialized Admin SDK.
 */
export async function checkFirestoreConnection() {
  if (!firebaseReady || !db) {
    return {
      connected: false,
      projectId,
      error: firebaseError || 'Firebase Admin is not initialized',
    };
  }

  try {
    const collections = await db.listCollections();
    return {
      connected: true,
      projectId,
      collectionCount: collections.length,
    };
  } catch (error) {
    return {
      connected: false,
      projectId,
      error: error.message,
    };
  }
}

export { adminApp, db, auth, projectId, firebaseReady, firebaseError };

