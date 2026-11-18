import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Public Firebase Web SDK client configuration (safe for browser bundles; backend Admin credentials remain private)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDJ9og8NPmiRS_DcRfsn2gz7CCNLc2M3W4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'techtonic-store.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'techtonic-store',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'techtonic-store.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '682902942732',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:682902942732:web:289baea865dae05635ea29',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-2BQVSZ90E3',
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
