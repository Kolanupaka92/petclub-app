/**
 * PETclub — Firebase Cloud Messaging (Push Notifications)
 *
 * Setup steps (when ready to activate):
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Add a Web app → copy the config below into .env as VITE_FIREBASE_* vars
 * 3. Enable Cloud Messaging in Firebase Console
 * 4. Generate a VAPID key pair (Project Settings → Cloud Messaging → Web Push Certificates)
 * 5. Add VITE_FIREBASE_VAPID_KEY to .env
 * 6. Add service account JSON to Railway as FIREBASE_SERVICE_ACCOUNT_JSON (backend)
 * 7. Deploy both frontend and backend
 */

import { api } from './api.js';

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Only activate if all config vars are present
const isConfigured = Object.values(FIREBASE_CONFIG).every(Boolean) && VAPID_KEY;

let messagingInstance = null;

/**
 * Initialize FCM and request notification permission.
 * Saves the FCM token to the backend automatically.
 * Call this once after the user logs in.
 */
export const initPushNotifications = async () => {
  if (!isConfigured) {
    console.info('[FCM] Push notifications not configured yet — set VITE_FIREBASE_* env vars to activate.');
    return null;
  }

  // Check browser support
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('[FCM] Browser does not support notifications or service workers.');
    return null;
  }

  try {
    // Dynamic import — only loads firebase if env vars are set (saves bundle size)
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);
    messagingInstance = messaging;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Notification permission denied by user.');
      return null;
    }

    // Register service worker
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (!token) {
      console.warn('[FCM] No token returned — check VAPID key and Firebase config.');
      return null;
    }

    // Save token to backend
    await api.saveFcmToken(token).catch(() => {});
    console.info('[FCM] Push notifications enabled ✅');

    // Handle foreground messages (app is open)
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        // Show a browser notification even when the app is in foreground
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon-72.svg',
            data: payload.data,
          });
        }
      }
    });

    return token;
  } catch (err) {
    console.warn('[FCM] Failed to initialize push notifications:', err.message);
    return null;
  }
};

/**
 * Razorpay payment checkout helper.
 * Call this when the user clicks "Pay Now" on a confirmed booking.
 *
 * @param {object} opts
 * @param {number}  opts.amount      - Amount in INR (e.g. 599 for ₹599)
 * @param {string}  opts.bookingId   - Booking UUID
 * @param {string}  opts.userName    - Customer's name
 * @param {string}  opts.userPhone   - Customer's phone
 * @param {string}  opts.userEmail   - Customer's email
 * @param {string}  opts.description - Service description
 * @param {function} opts.onSuccess  - Callback with payment result
 * @param {function} opts.onFailure  - Callback with error
 */
export const openRazorpayCheckout = async ({ amount, bookingId, userName, userPhone, userEmail, description, onSuccess, onFailure }) => {
  try {
    // Get Razorpay order from backend
    const { order, key, coming_soon } = await api.createPaymentOrder(amount, bookingId);

    if (coming_soon) {
      alert('💳 Payments coming soon! LLC registration is in progress. Your booking is confirmed, pay in person.');
      return;
    }

    // Load Razorpay checkout script dynamically
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const rzp = new window.Razorpay({
      key,
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.id,
      name: 'PETclub',
      description,
      image: 'https://app.mypetclub.app/icon-192.png',
      prefill: { name: userName, contact: userPhone, email: userEmail },
      theme: { color: '#f97316' },
      handler: async (response) => {
        try {
          // Verify payment signature on backend
          const result = await api.verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            bookingId,
          );
          onSuccess?.(result);
        } catch (e) {
          onFailure?.(e);
        }
      },
      modal: {
        ondismiss: () => onFailure?.(new Error('Payment cancelled')),
      },
    });

    rzp.open();
  } catch (err) {
    onFailure?.(err);
  }
};
