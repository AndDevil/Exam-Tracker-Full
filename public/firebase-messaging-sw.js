// Import compatibility scripts for Firebase v10
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Parse configuration from query parameters to avoid hardcoding secrets
const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get('apiKey');

if (apiKey) {
  firebase.initializeApp({
    apiKey: apiKey,
    authDomain: urlParams.get('authDomain'),
    projectId: urlParams.get('projectId'),
    storageBucket: urlParams.get('storageBucket'),
    messagingSenderId: urlParams.get('messagingSenderId'),
    appId: urlParams.get('appId')
  });

  const messaging = firebase.messaging();

  // Handle background notifications
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'Exam Tracker Pro Reminder';
    const notificationOptions = {
      body: payload.notification?.body || 'You have an upcoming exam milestone!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('[firebase-messaging-sw.js] No config query parameters found. Service worker initialized in idle mode.');
}
