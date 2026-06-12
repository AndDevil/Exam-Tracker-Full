import { messaging, db, app } from './firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

/**
 * Request notification permissions and register token.
 */
export const requestAndRegisterToken = async (userId) => {
  if (!messaging) {
    console.warn("FCM Messaging is not supported or initialized on this client.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied by user.');
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VITE_FIREBASE_VAPID_KEY is missing from environment. Cannot register FCM.");
      return null;
    }

    const config = app.options;
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(config.apiKey)}` +
      `&authDomain=${encodeURIComponent(config.authDomain)}` +
      `&projectId=${encodeURIComponent(config.projectId)}` +
      `&storageBucket=${encodeURIComponent(config.storageBucket || '')}` +
      `&messagingSenderId=${encodeURIComponent(config.messagingSenderId)}` +
      `&appId=${encodeURIComponent(config.appId)}`
    );

    const token = await getToken(messaging, { serviceWorkerRegistration: registration, vapidKey });
    
    if (token) {
      // Store token under users/{userId}/tokens/{token}
      const tokenDocRef = doc(db, 'users', userId, 'tokens', token);
      await setDoc(tokenDocRef, {
        token,
        userId,
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
      });
      return token;
    } else {
      throw new Error('No registration token retrieved. Check VAPID settings.');
    }
  } catch (error) {
    console.error('Failed to request or save FCM token:', error);
    throw error;
  }
};

/**
 * Delete a registration token (for example, on logout or when disabling permissions).
 */
export const unregisterToken = async (userId, token) => {
  if (!token) return;
  try {
    const tokenDocRef = doc(db, 'users', userId, 'tokens', token);
    await deleteDoc(tokenDocRef);
  } catch (error) {
    console.error('Failed to unregister FCM token:', error);
  }
};
