// Author: Sai Kolanupaka
// Strip UTF-8 BOM (﻿ / ﻿) that Vercel sometimes injects into env var values
const _stripBom = (v) => (v || '').replace(/^﻿/, '').trim();

// One-time migration: clear the old localStorage auth token.
// Before v1.40 (Jun 27 2026) the JWT was stored in localStorage under this key.
// Any leftover value (including the string "undefined" written by old code) would
// cause stale bundles to send `Authorization: Bearer undefined`, breaking all API
// calls after login.  Removing it here ensures the key is always absent on any
// client that loads this module.
try { localStorage.removeItem('petclub_token'); } catch { /* private-browsing or storage-full — harmless */ }

const BASE = _stripBom(import.meta.env.VITE_API_URL) || (() => {
  if (import.meta.env.DEV) {
    // Hard-fail in dev — prevents accidentally hitting production from local builds
    throw new Error('[PETclub] VITE_API_URL is not set. Create a .env.local file with:\nVITE_API_URL=http://localhost:5000/api');
  }
  // In production builds: warn and fall back to the default API URL
  console.warn('[PETclub] VITE_API_URL not set — falling back to production API.');
  return 'https://api.mypetclub.app/api';
})();

// Tracks whether a refresh is already in-flight so concurrent 401s share one refresh call
let _refreshPromise = null;

// Exported so components that call fetch() directly instead of req() (e.g.
// AddressPicker's geocode/reverse-geocode calls) can retry once on 401
// instead of silently failing when the 15m access-token cookie expires.
export const silentRefresh = async () => {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  }).then(r => {
    _refreshPromise = null;
    return r.ok;
  }).catch(() => {
    _refreshPromise = null;
    return false;
  });
  return _refreshPromise;
};

const req = async (method, path, body, requireAuth = false, _swRetry = false, _refreshed = false) => {
  const headers = { 'Content-Type': 'application/json' };
  // Auth via httpOnly cookie — browser sends it automatically with credentials:'include'
  // No token in JS memory; XSS cannot steal it
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',   // send cookie on every request, auth and non-auth alike
    body: body ? JSON.stringify(body) : undefined,
  });

  // ── 405 auto-recovery ────────────────────────────────────────────────────
  // A 405 that our backend never generates means a stale service worker is
  // intercepting the request before it reaches the network. Unregister all
  // SWs and retry the request exactly once.
  if (res.status === 405 && !_swRetry && 'serviceWorker' in navigator) {
    console.warn('[api] 405 detected — unregistering stale service worker and retrying');
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    } catch { /* ignore — proceed with retry regardless */ }
    return req(method, path, body, requireAuth, true, _refreshed);
  }

  // ── 401 — silent refresh, then retry once ────────────────────────────────
  // Access tokens are 15m. On 401 we silently try POST /auth/refresh (which
  // rotates the httpOnly refresh cookie and sets a new access token cookie).
  // Only if refresh also fails do we force logout.
  if (res.status === 401 && !_refreshed) {
    const ok = await silentRefresh();
    if (ok) {
      return req(method, path, body, requireAuth, _swRetry, true);
    }
    // Refresh failed — session is truly expired
    localStorage.removeItem('petclub_session');
    window.dispatchEvent(new CustomEvent('petclub:unauthorized'));
    throw new Error('Your session has expired. Please sign in again.');
  }

  // Safely parse JSON — handles empty bodies & rate-limit HTML responses
  let data = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`Server error (${res.status}). Please try again.`);
    return {};
  }
  if (res.status === 401) {
    // Already retried after refresh and still 401 — force logout
    localStorage.removeItem('petclub_session');
    window.dispatchEvent(new CustomEvent('petclub:unauthorized'));
    throw new Error('Your session has expired. Please sign in again.');
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}) [${res.url}]`);
  return data;
};

export const api = {
  // Auth — Firebase Phone Auth (primary) + Email OTP (fallback)
  // Legacy /auth/send-otp and /auth/verify-otp removed — use firebaseVerify or sendEmailOTP/verifyEmailOTP

  // User
  getMe: () => req('GET', '/users/me', null, true),
  updateMe: (data) => req('PUT', '/users/me', data, true),
  requestEmailChange: (email) => req('POST', '/users/me/email', { email }, true),
  verifyEmailChange: (email, otp) => req('POST', '/users/me/email/verify', { email, otp }, true),
  setRole: (role, subRole, name, email, city, address, pet, addressLat, addressLng, addressPostalCode, addressCity, addressState, referralInput) =>
    req('POST', '/users/set-role', { role, subRole, name, email, city, address, pet, addressLat, addressLng, addressPostalCode, addressCity, addressState, referral_input: referralInput || undefined }, true),

  // Pets
  getPets: () => req('GET', '/pets', null, true),
  addPet: (data) => req('POST', '/pets', data, true),
  updatePet: (id, data) => req('PUT', `/pets/${id}`, data, true),

  // Records
  getRecords: (petId, type) => req('GET', `/pets/${petId}/records/${type}`, null, true),
  addRecord: (petId, type, data) => req('POST', `/pets/${petId}/records/${type}`, data, true),

  // Digital pet passport — scan a paper vaccination card / vet report.
  // US accounts only (enforced server-side); presign returns 403 otherwise.
  presignHealthDocument: (petId, docKind, ext) =>
    req('POST', `/pets/${petId}/health-documents/presign`, { docKind, ext }, true),
  extractHealthDocument: (petId, docId) =>
    req('POST', `/pets/${petId}/health-documents/${docId}/extract`, {}, true),
  confirmHealthDocument: (petId, docId, records) =>
    req('POST', `/pets/${petId}/health-documents/${docId}/confirm`, { records }, true),
  getHealthDocuments: (petId) => req('GET', `/pets/${petId}/health-documents`, null, true),

  // Bookings
  getBookings: () => req('GET', '/bookings', null, true),
  createBooking: (data) => req('POST', '/bookings', data, true),
  updateBookingStatus: (id, status, extras = {}) => req('PUT', `/bookings/${id}/status`, { status, ...extras }, true),
  cancelBooking:       (id, reason = '') => req('PUT', `/bookings/${id}/status`, { status: 'cancelled', reason }, true),
  markNoShow:          (id) => req('PUT', `/bookings/${id}/status`, { status: 'no_show' }, true),
  getCancelPreview:    (id) => req('GET', `/bookings/${id}/cancel-preview`, null, true),
  respondBooking: (id, action) => req('POST', `/bookings/${id}/respond`, { action }, true),
  getIncomingBookings: () => req('GET', '/bookings/incoming', null, true),
  adminAssignBooking:    (id, professionalId) => req('PUT', `/bookings/${id}/assign`, { professionalId }, true),
  adminSetRefundStatus:  (id, status)         => req('PUT', `/admin/bookings/${id}/refund-status`, { status }, true),
  getMessages:  (bookingId)          => req('GET',  `/bookings/${bookingId}/messages`, null, true),
  sendMessage:  (bookingId, content) => req('POST', `/bookings/${bookingId}/messages`, { content }, true),

  // Service Catalog (customer-facing pricing)
  getServiceCatalog: () => req('GET', '/services/catalog', null, true),

  // Loyalty Credits
  getLoyalty:        ()           => req('GET',  '/loyalty',                  null,   true),
  redeemCredits:     ()           => req('POST', '/loyalty/redeem',           {},     true),
  validateCoupon:    (code)       => req('POST', '/loyalty/validate-coupon',  { code }, true),
  adminAwardLoyalty: (userId, points, description) =>
    req('POST', '/admin/loyalty/award', { userId, points, description }, true),
  loyaltyStats:   (days = 30) => req('GET', `/admin/loyalty/stats?days=${days}`,  null, true),
  partnerReport:  (detail = false) => req('GET', `/admin/loyalty/partner-report${detail ? '?detail=true' : ''}`, null, true),
  // O-2 fix: booking revenue grouped by professional via SQL aggregate RPC
  revenueReport: (from_date, to_date) => {
    const params = new URLSearchParams();
    if (from_date) params.set('from_date', from_date);
    if (to_date)   params.set('to_date', to_date);
    return req('GET', `/admin/revenue-report?${params}`, null, true);
  },

  // Professionals
  getProfessionals: (city, role) =>
    req('GET', `/professionals?city=${city || ''}&sub_role=${role || ''}`),
  getMyProProfile: () => req('GET', '/professionals/me', null, true),
  getEarnings:    () => req('GET',  '/professionals/earnings', null, true),
  requestPayout:  (data) => req('POST', '/professionals/payout', data || {}, true),
  updateMyProProfile: (data) => req('PUT', '/professionals/me', data, true),
  uploadIdPhoto: (data) => req('POST', '/professionals/upload-id-photo', data, true),
  setAvailability: (is_available) => req('PUT', '/professionals/availability', { is_available }, true),

  // Live Tracking
  startJourney:   (id)           => req('POST', `/bookings/${id}/on-my-way`, {}, true),
  updateLocation: (id, lat, lng) => req('POST', `/bookings/${id}/location`, { lat, lng }, true),
  getTracking:    (id)           => req('GET',  `/bookings/${id}/tracking`, null, true),

  // Ratings
  rateBooking: (id, rating, review) => req('POST', `/bookings/${id}/rate`, { rating, review }, true),
  getMyRating: (id) => req('GET', `/bookings/${id}/my-rating`, null, true),
  // W-6 fix: fetch all booking IDs this user has already rated from the server.
  // Prevents the "re-rate" dialog from reappearing after localStorage is cleared.
  getMyRatings: () => req('GET', '/ratings/mine', null, true),

  // ID Documents
  uploadUserIdPhoto: (data) => req('POST', '/users/upload-id-photo', data, true),
  presignUserIdPhoto: (docType, docNumber, ext) => req('POST', '/users/upload-id-photo/presign', { docType, docNumber, ext }, true),

  // Auth — Firebase Phone Auth token exchange (kept for backwards compat)
  firebaseVerify: (idToken) => req('POST', '/auth/firebase-verify', { idToken }),

  // Auth — Backend Phone OTP via Twilio SMS (primary, no reCAPTCHA required)
  sendPhoneOTP: (phone, email) => req('POST', '/auth/send-phone-otp', { phone, ...(email ? { email } : {}) }),
  verifyPhoneOTP: (phone, otp) => req('POST', '/auth/verify-phone-otp', { phone, otp }),

  // Auth — Email OTP fallback (for users without phone access)
  sendEmailOTP: (email) => req('POST', '/auth/send-email-otp', { email }),
  verifyEmailOTP: (email, otp) => req('POST', '/auth/verify-email-otp', { email, otp }),

  // Push Notifications (FCM)
  saveFcmToken: (token) => req('POST', '/users/fcm-token', { token }, true),

  // Payments (Razorpay — active after LLC registration)
  getPaymentConfig: () => req('GET', '/payments/config', null, true),
  createPaymentOrder: (amount, bookingId, notes) => req('POST', '/payments/create-order', { amount, booking_id: bookingId, notes }, true),
  verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId) =>
    req('POST', '/payments/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id: bookingId }, true),

  // Payments (Stripe — USD bookings; env-gated, returns coming_soon until keys are set)
  getStripeConfig: () => req('GET', '/payments/stripe/config', null, true),
  createStripeIntent: (bookingId) => req('POST', '/payments/stripe/create-intent', { booking_id: bookingId }, true),

  // Subscriptions — recurring care plans
  getSubscriptionPlans: () => req('GET', '/subscriptions/plans'),
  subscribe:            (planId) => req('POST', '/subscriptions', { plan_id: planId }, true),
  getMySubscriptions:   () => req('GET', '/subscriptions/me', null, true),
  cancelSubscription:   (id) => req('POST', `/subscriptions/${id}/cancel`, {}, true),

  // Admin
  // Professional reviews (public)
  getProReviews: (profId, page = 1) => req('GET', `/professionals/${profId}/reviews?page=${page}&limit=10`),

  // Reschedule
  rescheduleBooking: (id, scheduled_at) => req('PUT', `/bookings/${id}/reschedule`, { scheduled_at }, true),

  // Notification inbox
  getNotifications: (limit = 20) => req('GET', `/notifications?limit=${limit}`, null, true),
  markNotificationsRead: (ids) => req('PATCH', '/notifications/read', ids?.length ? { ids } : {}, true),

  getSignedDocUrl: (path) => req('GET', `/admin/signed-url?path=${encodeURIComponent(path)}`, null, true),
  getAdminStats: () => req('GET', '/admin/stats', null, true),
  // O-1 fix: paginated with optional search. page/limit/search are all optional.
  getAdminUsers: ({ page = 1, limit = 50, search = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    return req('GET', `/admin/users?${params}`, null, true);
  },
  getPendingVerifications: () => req('GET', '/admin/pending-verifications', null, true),
  verifyProfessional: (id, action, reason) => req('PUT', `/admin/verify/${id}`, { action, reason }, true),
  suspendUser: (id) => req('PUT', `/admin/users/${id}/suspend`, {}, true),
  deleteUser: (id) => req('DELETE', `/admin/users/${id}`, null, true),
  purgeAllSuspended: () => req('DELETE', '/admin/users/suspended/purge-all?confirm=yes', null, true),
  dbAudit:   ()          => req('GET',    '/admin/db-audit',   null, true),
  dbCleanup: (targets)   => req('DELETE', '/admin/db-cleanup', { targets }, true),
  setUserSubRole: (id, subRole) => req('PUT', `/admin/users/${id}/set-role`, { subRole }, true),
  adminEditUser: (id, data) => req('POST', `/admin/users/${id}/edit`, data, true),
  // Admin payouts
  adminGetPayouts: () => req('GET', '/admin/payouts', null, true),
  adminMarkPaid: (profId) => req('POST', `/admin/payouts/${profId}/mark-paid`, {}, true),
  // Admin testing tools
  getOtp: (phone, cc = '91') => req('GET', `/admin/otp?phone=${encodeURIComponent(phone)}&cc=${cc}`, null, true),

  // Health
  health:      () => req('GET', '/health'),
  adminHealth: () => req('GET', '/admin/health', null, true),
};

// Token is now an httpOnly cookie set by the backend — not accessible from JS.
// These stubs remain for call-site compat; they are no-ops.
export const saveToken = (_token) => {};
export const clearToken = () => {};
export const hasToken = () => true;  // backend /api/users/me is authoritative

export const logout = () => req('POST', '/auth/logout');
