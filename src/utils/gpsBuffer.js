/**
 * gpsBuffer.js — IndexedDB queue for offline GPS position buffering
 *
 * When the provider's connection drops during transit, location updates
 * can't reach the API. This module writes failed positions to IndexedDB
 * and registers a Background Sync tag so the service worker retries them
 * automatically the moment connectivity is restored — even if the tab was
 * closed in the meantime.
 *
 * The SW side (firebase-messaging-sw.js) reads from the same DB schema
 * and handles the 'flush-gps-positions' sync event.
 */

export const GPS_DB_NAME    = 'petclub-gps-v1';
export const GPS_DB_VERSION = 1;
export const SYNC_TAG       = 'flush-gps-positions';

/** Open (or upgrade) the shared GPS IndexedDB. */
function openGpsDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(GPS_DB_NAME, GPS_DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Buffered positions waiting to be POSTed to the API
      if (!db.objectStoreNames.contains('positions'))
        db.createObjectStore('positions', { keyPath: 'id', autoIncrement: true });
      // Small key-value store (token, etc.)
      if (!db.objectStoreNames.contains('meta'))
        db.createObjectStore('meta', { keyPath: 'key' });
    };

    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = ()  => reject(req.error);
  });
}

/**
 * Buffer a GPS position that failed to POST (e.g., no connectivity).
 * Registers a Background Sync tag so the SW flushes it when online.
 */
export async function bufferPosition(bookingId, lat, lng) {
  try {
    const db = await openGpsDb();
    await new Promise((resolve, reject) => {
      const tx  = db.transaction('positions', 'readwrite');
      tx.objectStore('positions').add({ bookingId, lat, lng, ts: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('[gpsBuffer] Failed to write position to IDB:', e);
    return; // non-fatal — don't crash the app
  }

  // Ask the SW to flush the queue when the network is available
  if (!('serviceWorker' in navigator)) return;
  try {
    const sw = await navigator.serviceWorker.ready;
    if (sw?.sync) await sw.sync.register(SYNC_TAG);
  } catch (e) {
    console.warn('[gpsBuffer] Background Sync not supported or denied:', e.message);
  }
}

/**
 * Write the current auth token to IDB so the service worker can read it
 * when flushing the queue (SW has no access to localStorage).
 * Call this once when GPS tracking starts.
 */
export async function saveTokenToGpsDb(token) {
  if (!token) return;
  try {
    const db = await openGpsDb();
    await new Promise((resolve) => {
      const tx = db.transaction('meta', 'readwrite');
      tx.objectStore('meta').put({ key: 'token', value: token });
      tx.oncomplete = resolve;
      tx.onerror    = resolve; // non-critical, don't reject
    });
  } catch (e) {
    console.warn('[gpsBuffer] Failed to write token to IDB:', e);
  }
}
