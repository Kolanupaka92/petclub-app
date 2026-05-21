/**
 * PETclub — Firebase Cloud Messaging Service Worker
 * Handles background push notifications when the app is not in focus.
 *
 * This file must be at the root: /firebase-messaging-sw.js
 * It is auto-registered by src/firebase.js
 */

// ── Self-update: skip the "waiting" phase so new SW versions activate immediately
// on the next page load without requiring the user to close all tabs first.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
// Claim all open clients immediately after activation so the new SW takes effect
// in already-open tabs without a reload.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── API pass-through fetch guard ─────────────────────────────────────────────
// The Firebase messaging compat SDK (loaded below) registers its own fetch
// event listener to support notification click handling. In some cached SW
// versions it has been observed to return 405 for unrecognised POST requests.
//
// Registering OUR fetch listener FIRST (before importScripts loads Firebase)
// ensures we get first pick on every fetch event. For requests to our backend
// API we respond immediately with a clean network fetch so Firebase's handler
// never sees them. For everything else we fall through so Firebase can handle
// push-notification-related requests normally.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Intercept only our own API — pass straight to the network, no caching
  if (url.includes('api.mypetclub.app') || url.includes('mypetclub.app/api')) {
    event.respondWith(
      fetch(event.request.clone()).catch(() =>
        new Response(JSON.stringify({ error: 'Network error — check your connection' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }
  // All other requests: don't call respondWith → browser + Firebase handle normally
});

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

// ── Background Sync — GPS position queue ────────────────────────────────────
// When the provider's connection drops during transit, the main thread writes
// failed positions to IndexedDB and registers this sync tag.  The browser
// fires the 'sync' event automatically the moment connectivity is restored —
// even if the app tab has been closed.
//
// NOTE: Service workers cannot access navigator.geolocation. This handler
// only retries positions that the main thread already captured and buffered.
// Screen-lock GPS suspension is solved by the Screen Wake Lock API in App.jsx.

const GPS_DB_NAME    = 'petclub-gps-v1';
const GPS_DB_VERSION = 1;
const API_BASE       = 'https://api.mypetclub.app/api';

function swOpenGpsDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(GPS_DB_NAME, GPS_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('positions'))
        db.createObjectStore('positions', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('meta'))
        db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = ()  => reject(req.error);
  });
}

function swGetAllPositions(db) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('positions', 'readonly');
    const req = tx.objectStore('positions').getAll();
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror   = ()  => reject(req.error);
  });
}

function swDeletePosition(db, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('positions', 'readwrite');
    const req = tx.objectStore('positions').delete(id);
    req.onsuccess = resolve;
    req.onerror   = () => reject(req.error);
  });
}

async function swGetToken() {
  try {
    const db = await swOpenGpsDb();
    return new Promise((resolve) => {
      const tx  = db.transaction('meta', 'readonly');
      const req = tx.objectStore('meta').get('token');
      req.onsuccess = (e) => resolve(e.target.result?.value || null);
      req.onerror   = ()  => resolve(null);
    });
  } catch { return null; }
}

async function flushGpsBuffer() {
  const token = await swGetToken();
  if (!token) return; // no token — nothing we can do, will retry on next sync

  const db        = await swOpenGpsDb();
  const positions = await swGetAllPositions(db);
  if (!positions.length) return;

  for (const pos of positions) {
    try {
      const res = await fetch(
        `${API_BASE}/bookings/${pos.bookingId}/location`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body:    JSON.stringify({ lat: pos.lat, lng: pos.lng }),
        }
      );
      if (res.ok) {
        await swDeletePosition(db, pos.id); // confirmed → remove from queue
      } else if (res.status === 401) {
        break; // token expired — stop flushing, user must re-auth
      }
      // 5xx or other errors: leave in queue, SW will retry on next sync opportunity
    } catch {
      break; // still offline — stop here, browser will re-fire sync when reconnected
    }
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-gps-positions') {
    event.waitUntil(flushGpsBuffer());
  }
});
// ─────────────────────────────────────────────────────────────────────────────

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
