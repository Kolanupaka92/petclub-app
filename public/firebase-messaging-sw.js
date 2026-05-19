/**
 * PETclub — Firebase Cloud Messaging Service Worker
 * Handles background push notifications when the app is not in focus.
 *
 * This file must be at the root: /firebase-messaging-sw.js
 * It is auto-registered by src/firebase.js
 */

// Import Firebase scripts — these are loaded from Google's CDN in the service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config is embedded at build time via a fetch to the app origin,
// but for service workers we use the compat SDK with hardcoded config.
// NOTE: Replace these values with your Firebase project config when activating.
// These are public-safe values (not secret keys).
// These are public-safe client-side values (same as what's in the JS bundle)
const firebaseConfig = {
  apiKey:            "AIzaSyAdujAwkAeZgji5sXbHlj80W9xw9q4EVL8",
  authDomain:        "petclub-43982.firebaseapp.com",
  projectId:         "petclub-43982",
  storageBucket:     "petclub-43982.firebasestorage.app",
  messagingSenderId: "326567194811",
  appId:             "1:326567194811:web:6680bef4b86e529e43b99e",
};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages (app is closed or not in focus)
  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    const notifTitle = title || '🐾 PETclub';
    const notifBody  = body  || 'You have a new notification';

    self.registration.showNotification(notifTitle, {
      body: notifBody,
      icon: '/icon.svg',
      badge: '/icon-72.svg',
      vibrate: [200, 100, 200],
      data: {
        url: 'https://app.mypetclub.app',
        ...payload.data,
      },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  });

  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;
    const url = event.notification.data?.url || 'https://app.mypetclub.app';
    event.waitUntil(clients.openWindow(url));
  });
}
