// Firebase Setup Instructions for User:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Go to Project Settings -> General -> Your apps -> Web app -> Register app
// 3. Copy the firebaseConfig object properties and place them in the project's .env file:
//    VITE_FIREBASE_API_KEY=...
//    VITE_FIREBASE_AUTH_DOMAIN=...
//    etc.
// 4. Enable Google Sign-In in Authentication -> Sign-in method -> Add new provider -> Google
// 5. Enable Cloud Firestore in Build -> Firestore Database -> Create Database (Start in test mode or deploy rules)
// 6. Enable Cloud Messaging in Project Settings -> Cloud Messaging -> Generate VAPID key

import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

// Helper to sanitize variables from .env (remove trailing spaces, newlines, or carriage returns)
const sanitizeConfigValue = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[\r\n]/g, '');
};

const firebaseConfig = {
  apiKey: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

// Initialize Firebase App
console.log('Firebase Config Initialized:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 6)}... (length: ${firebaseConfig.apiKey.length})` : 'undefined'
});
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Persistent Offline Cache (v10+ SDK syntax)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Initialize Auth
const auth = getAuth(app);

// Initialize Cloud Messaging (safe fallback if unsupported by browser)
let messaging = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Cloud Messaging is not supported in this browser:', error);
}

export { app, db, auth, messaging };
