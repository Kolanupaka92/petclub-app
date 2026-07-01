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
// ── Helper: replace the reCAPTCHA container with a brand-new element ──────────
// Google's reCAPTCHA registers elements in an internal global registry by DOM
// node reference. innerHTML-wiping or .clear() do NOT remove that registry entry.
// The only reliable way to get a clean slate is to remove the old element from
// the DOM entirely and insert a fresh one. This prevents "reCAPTCHA has already
// been rendered in this element" on back-navigation, Resend OTP, or any re-init.
const _freshRecaptchaEl = () => {
  const OLD_ID = 'recaptcha-container';
  const old = document.getElementById(OLD_ID);
  const parent = old?.parentNode || document.body;

  // Remove the old element (and its reCAPTCHA registration) from the DOM
  if (old) parent.removeChild(old);

  // Create a completely fresh element with the same ID
  const fresh = document.createElement('div');
  fresh.id = OLD_ID;
  fresh.style.cssText = 'position:fixed;bottom:0;left:0;z-index:-1;opacity:0;pointer-events:none;';
  parent.appendChild(fresh);
  return OLD_ID; // return the ID string for RecaptchaVerifier
};

export const initPhoneAuth = async (containerId = 'recaptcha-container') => {
  if (!phoneConfigured) {
    console.warn('[PhoneAuth] Firebase config incomplete — check VITE_FIREBASE_* env vars');
    return false;
  }

  try {
    const app = await getApp();
    const { getAuth, RecaptchaVerifier } = await import('firebase/auth');

    _auth = getAuth(app);

    // Destroy the old Firebase verifier object first
    if (_recaptchaVerifier) {
      try { _recaptchaVerifier.clear(); } catch {}
      _recaptchaVerifier = null;
    }

    // Replace the container element entirely — this clears Google's internal registry
    const elId = _freshRecaptchaEl();

    _recaptchaVerifier = new RecaptchaVerifier(_auth, elId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        if (_recaptchaVerifier) {
          try { _recaptchaVerifier.clear(); } catch {}
          _recaptchaVerifier = null;
          _freshRecaptchaEl(); // swap out the element for next render
        }
      },
    });

    // Render reCAPTCHA — no hard timeout so slow networks (India 3G) don't auto-fail.
    await _recaptchaVerifier.render();

    console.info('[PhoneAuth] ✅ Initialized successfully');
    return true;
  } catch (e) {
    const code = e.code || '';
    console.error('[PhoneAuth] Init failed:', e.message, code);
    if (code === 'auth/operation-not-allowed') {
      console.error('[PhoneAuth] ⚠️  Enable Phone sign-in: Firebase Console → Authentication → Sign-in method → Phone → Enable');
    }
    _auth = null;
    _recaptchaVerifier = null;
    _freshRecaptchaEl(); // swap element so next attempt starts clean
    // Surface the error code so the UI can display it
    const err = new Error(e.message || 'Firebase phone auth failed');
    err.code = code;
    throw err;
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
  try {
    return await api.firebaseVerify(idToken);
  } catch (backendErr) {
    // C-6 fix: if the backend JWT exchange fails for any reason (500, network
    // error, rate limit), sign the user out of Firebase immediately.
    // Without this, the user is stuck in a half-authenticated state where
    // Firebase sees them as signed in but PETclub has no JWT in localStorage.
    // Signing out here ensures the next login attempt starts from a clean state.
    try {
      const { getAuth, signOut } = await import('firebase/auth');
      await signOut(getAuth());
    } catch (signOutErr) {
      console.warn('[PhoneAuth] sign-out after backend failure failed:', signOutErr.message);
    }
    // Re-throw — use the backend's error message when it's specific, otherwise
    // fall back to a generic message so the user sees the real cause (e.g.
    // "Firebase not configured on server", "Failed to create user. Try again.").
    const msg = backendErr?.message || 'Verification failed — please try again.';
    const err = new Error(msg);
    err.code  = backendErr?.code || 'auth/backend-error';
    err.cause = backendErr;
    throw err;
  }
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
  // Replace the DOM element entirely — innerHTML wipe does NOT clear Google's
  // internal reCAPTCHA registry, so back-navigation would re-trigger the
  // "reCAPTCHA has already been rendered in this element" error.
  _freshRecaptchaEl();
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
      onSuccess?.({ offline: true });
      return;
    }
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        // 8s cap — checkout.js is a third-party CDN load; don't leave the user
        // staring at a spinner forever if the request stalls (script.onerror
        // only fires on hard network failure, not on a hung connection).
        const timer = setTimeout(() => reject(new Error('Razorpay checkout script timed out')), 8000);
        script.onload  = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); reject(new Error('Failed to load Razorpay checkout script')); };
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
      image: `${import.meta.env.VITE_APP_URL || 'https://app.mypetclub.app'}/icon-192.png`,
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
