/**
 * PETclub — Firebase module
 * - Phone Auth (OTP via Firebase SMS — 10k/month free)
 * - Cloud Messaging (push notifications — FCM)
 * - Razorpay checkout helper
 */

import { api } from './api.js';

// Strip BOM (﻿) and surrounding whitespace — Vercel sometimes injects a UTF-8 BOM
// when env vars are uploaded via the dashboard, which makes values look non-empty but invalid.
const stripBom = (v) => (v || '').replace(/^﻿/, '').trim();

const FIREBASE_CONFIG = {
  apiKey:            stripBom(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain:        stripBom(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId:         stripBom(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket:     stripBom(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: stripBom(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId:             stripBom(import.meta.env.VITE_FIREBASE_APP_ID),
};

const VAPID_KEY = stripBom(import.meta.env.VITE_FIREBASE_VAPID_KEY);
// Phone auth only needs FIREBASE_CONFIG — VAPID_KEY is for FCM push notifications only
const phoneConfigured = Object.values(FIREBASE_CONFIG).every(Boolean);
const isConfigured = phoneConfigured; // kept for backward compat

// Debug: log which keys are present/missing (values never logged for security)
if (!phoneConfigured) {
  const missing = Object.entries(FIREBASE_CONFIG).filter(([, v]) => !v).map(([k]) => k);
  console.warn('[Firebase] Missing/empty config keys:', missing,
    '— set VITE_FIREBASE_* env vars in Vercel Production without BOM characters');
} else {
  console.info('[Firebase] Config loaded for project:', FIREBASE_CONFIG.projectId);
}

// ─── Shared Firebase app init ────────────────────────────────────────────────
let _app = null;
const getApp = async () => {
  if (_app) return _app;
  const { initializeApp, getApps, getApp: _getApp } = await import('firebase/app');
  _app = getApps().length ? _getApp() : initializeApp(FIREBASE_CONFIG);
  return _app;
};

// ═══════════════════════════════════════════════════════
//  PHONE AUTH — Firebase Phone Auth (replaces Twilio OTP)
//  Free tier: 10,000 SMS verifications/month
// ═══════════════════════════════════════════════════════
let _auth = null;
let _recaptchaVerifier = null;
let _confirmationResult = null;

/**
 * Initialize Firebase Auth + invisible reCAPTCHA.
 * Call once when the phone-entry screen mounts.
 * @param {string} containerId — id of a <div> in the DOM for the reCAPTCHA widget
 */
export const initPhoneAuth = async (containerId = 'recaptcha-container') => {
  if (!phoneConfigured) {
    console.warn('[PhoneAuth] Firebase config incomplete — check VITE_FIREBASE_* env vars');
    return false;
  }
  try {
    const app = await getApp();
    const { getAuth, RecaptchaVerifier } = await import('firebase/auth');

    _auth = getAuth(app);

    // Clear any stale verifier before creating a new one
    if (_recaptchaVerifier) {
      try { _recaptchaVerifier.clear(); } catch {}
      _recaptchaVerifier = null;
    }

    // Verify the container element exists in the DOM
    const containerEl = document.getElementById(
      typeof containerId === 'string' ? containerId : 'recaptcha-container'
    );
    if (!containerEl) {
      console.error('[PhoneAuth] recaptcha-container element not found in DOM');
      return false;
    }

    // Pass string ID (not DOM element) — Firebase Auth SDK resolves it at render time.
    // Using the string avoids any timing edge-cases with element references.
    _recaptchaVerifier = new RecaptchaVerifier(_auth, typeof containerId === 'string' ? containerId : 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        if (_recaptchaVerifier) {
          try { _recaptchaVerifier.clear(); } catch {}
          _recaptchaVerifier = null;
        }
      },
    });

    // Render reCAPTCHA — no hard timeout so slow networks (India 3G) don't auto-fail.
    // If reCAPTCHA is genuinely unavailable the promise rejects with an auth/* error
    // which the catch block handles and falls back to Email OTP.
    await _recaptchaVerifier.render();

    console.info('[PhoneAuth] ✅ Initialized successfully');
    return true;
  } catch (e) {
    console.error('[PhoneAuth] Init failed:', e.message, e.code || '');
    if (e.code === 'auth/operation-not-allowed') {
      console.error('[PhoneAuth] ⚠️  Enable Phone sign-in: Firebase Console → Authentication → Sign-in method → Phone → Enable');
    }
    _auth = null;
    _recaptchaVerifier = null;
    return false;
  }
};

/**
 * Send OTP to a phone number via Firebase.
 * @param {string} e164Phone — E.164 format e.g. '+919876543210' or '+14155552671'
 * @returns {boolean} true if sent successfully
 */
export const sendPhoneOtp = async (e164Phone) => {
  // Auto-recover if reCAPTCHA token expired between init and send
  if (_auth && !_recaptchaVerifier) {
    const ok = await initPhoneAuth('recaptcha-container');
    if (!ok) throw new Error('Phone auth not initialized');
  }
  if (!_auth || !_recaptchaVerifier) throw new Error('Phone auth not initialized');
  const { signInWithPhoneNumber } = await import('firebase/auth');
  _confirmationResult = await signInWithPhoneNumber(_auth, e164Phone, _recaptchaVerifier);
  return true;
};

/**
 * Verify the 6-digit OTP the user entered.
 * On success, exchanges the Firebase ID token for a PETclub JWT via the backend.
 * @param {string} otp — 6-digit code from the user
 * @returns {{ token, isNew, user }} — same shape as the old /auth/verify-otp response
 */
export const verifyPhoneOtp = async (otp) => {
  if (!_confirmationResult) throw new Error('No pending OTP — send one first');
  const result = await _confirmationResult.confirm(otp);
  const idToken = await result.user.getIdToken();
  // Exchange Firebase token for our JWT (keeps rest of app unchanged)
  return api.firebaseVerify(idToken);
};

/**
 * Clean up reCAPTCHA (call when the login component unmounts).
 */
export const clearPhoneAuth = () => {
  if (_recaptchaVerifier) {
    try { _recaptchaVerifier.clear(); } catch {}
    _recaptchaVerifier = null;
  }
  _confirmationResult = null;
};

// ═══════════════════════════════════════════════════════
//  PUSH NOTIFICATIONS — Firebase Cloud Messaging (FCM)
// ═══════════════════════════════════════════════════════
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
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('[FCM] Browser does not support notifications or service workers.');
    return null;
  }
  try {
    const app = await getApp();
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

    const messaging = getMessaging(app);
    messagingInstance = messaging;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Notification permission denied by user.');
      return null;
    }

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (!token) {
      console.warn('[FCM] No token returned — check VAPID key and Firebase config.');
      return null;
    }

    await api.saveFcmToken(token).catch(() => {});
    console.info('[FCM] Push notifications enabled ✅');

    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon-72.svg',
          data: payload.data,
        });
      }
    });

    return token;
  } catch (err) {
    console.warn('[FCM] Failed to initialize push notifications:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════
//  RAZORPAY — Payment checkout helper
//  Active after LLC registration (set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET)
// ═══════════════════════════════════════════════════════
export const openRazorpayCheckout = async ({ amount, bookingId, userName, userPhone, userEmail, description, onSuccess, onFailure }) => {
  try {
    const { order, key, coming_soon } = await api.createPaymentOrder(amount, bookingId);
    if (coming_soon) {
      alert('💳 Payments coming soon! LLC registration is in progress. Your booking is confirmed, pay in person.');
      return;
    }
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
          const result = await api.verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            bookingId,
          );
          onSuccess?.(result);
        } catch (e) { onFailure?.(e); }
      },
      modal: { ondismiss: () => onFailure?.(new Error('Payment cancelled')) },
    });
    rzp.open();
  } catch (err) {
    onFailure?.(err);
  }
};
