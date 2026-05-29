// Strip UTF-8 BOM (﻿ / ﻿) that Vercel sometimes injects into env var values
const _stripBom = (v) => (v || '').replace(/^﻿/, '').trim();

const BASE = _stripBom(import.meta.env.VITE_API_URL) || (() => {
  if (import.meta.env.DEV) {
    // Hard-fail in dev — prevents accidentally hitting production from local builds
    throw new Error('[PETclub] VITE_API_URL is not set. Create a .env.local file with:\nVITE_API_URL=http://localhost:5000/api');
  }
  // In production builds: warn and fall back to the default API URL
  console.warn('[PETclub] VITE_API_URL not set — falling back to production API.');
  return 'https://api.mypetclub.app/api';
})();

const getToken = () => localStorage.getItem('petclub_token');

const req = async (method, path, body, requireAuth = false, _swRetry = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
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
    return req(method, path, body, requireAuth, true);
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
  // 401 — JWT expired or invalid: clear local session and signal the app to re-login
  if (res.status === 401) {
    localStorage.removeItem('petclub_token');
    localStorage.removeItem('petclub_session');
    // Dispatch a custom event — Root in main.jsx listens and calls doLogout()
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
  setRole: (role, subRole, name, email, city, address, pet, addressLat, addressLng, addressPostalCode, addressCity, addressState, referralInput) =>
    req('POST', '/users/set-role', { role, subRole, name, email, city, address, pet, addressLat, addressLng, addressPostalCode, addressCity, addressState, referral_input: referralInput || undefined }, true),

  // Pets
  getPets: () => req('GET', '/pets', null, true),
  addPet: (data) => req('POST', '/pets', data, true),
  updatePet: (id, data) => req('PUT', `/pets/${id}`, data, true),

  // Records
  getRecords: (petId, type) => req('GET', `/pets/${petId}/records/${type}`, null, true),
  addRecord: (petId, type, data) => req('POST', `/pets/${petId}/records/${type}`, data, true),

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
  requestPayout:  () => req('POST', '/professionals/payout',   {},   true),
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
  createPaymentOrder: (amount, bookingId, notes) => req('POST', '/payments/create-order', { amount, bookingId, notes }, true),
  verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId) =>
    req('POST', '/payments/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }, true),

  // Admin
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
  purgeAllSuspended: () => req('DELETE', '/admin/users/suspended/purge-all', null, true),
  dbAudit:   ()          => req('GET',    '/admin/db-audit',   null, true),
  dbCleanup: (targets)   => req('DELETE', '/admin/db-cleanup', { targets }, true),
  setUserSubRole: (id, subRole) => req('PUT', `/admin/users/${id}/set-role`, { subRole }, true),
  adminEditUser: (id, data) => req('POST', `/admin/users/${id}/edit`, data, true),
  // Admin testing tools
  getOtp: (phone, cc = '91') => req('GET', `/admin/otp?phone=${encodeURIComponent(phone)}&cc=${cc}`, null, true),

  // Health
  health:      () => req('GET', '/health'),
  adminHealth: () => req('GET', '/admin/health', null, true),
};

export const saveToken = (token) => localStorage.setItem('petclub_token', token);
export const clearToken = () => localStorage.removeItem('petclub_token');
export const hasToken = () => !!getToken();
