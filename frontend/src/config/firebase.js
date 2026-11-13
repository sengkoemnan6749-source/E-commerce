import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

let firebaseApp = null;
let firebaseAuth = null;
let googleProvider = null;
let firebaseAnalytics = null;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    isAnalyticsSupported()
      .then((supported) => {
        if (supported) {
          firebaseAnalytics = getAnalytics(firebaseApp);
        }
      })
      .catch(() => {});
  }
}

export { firebaseApp, firebaseAuth, googleProvider, firebaseAnalytics };
