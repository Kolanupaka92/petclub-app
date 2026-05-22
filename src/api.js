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
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}) [${res.url}]`);
  return data;
};

export const api = {
  // Auth — Firebase Phone Auth (primary) + Email OTP (fallback)
  // Legacy /auth/send-otp and /auth/verify-otp removed — use firebaseVerify or sendEmailOTP/verifyEmailOTP

  // User
  getMe: () => req('GET', '/users/me', null, true),
  updateMe: (data) => req('PUT', '/users/me', data, true),
  setRole: (role, subRole, name, email, city, address, pet, addressLat, addressLng, addressPostalCode, addressCity, addressState) =>
    req('POST', '/users/set-role', { role, subRole, name, email, city, address, pet, addressLat, addressLng, addressPostalCode, addressCity, addressState }, true),

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
  updateBookingStatus: (id, status) => req('PUT', `/bookings/${id}/status`, { status }, true),
  respondBooking: (id, action) => req('POST', `/bookings/${id}/respond`, { action }, true),
  getIncomingBookings: () => req('GET', '/bookings/incoming', null, true),
  adminAssignBooking: (id, professionalId) => req('PUT', `/bookings/${id}/assign`, { professionalId }, true),

  // Professionals
  getProfessionals: (city, role) =>
    req('GET', `/professionals?city=${city || ''}&sub_role=${role || ''}`),
  getMyProProfile: () => req('GET', '/professionals/me', null, true),
  getEarnings: () => req('GET', '/professionals/earnings', null, true),
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

  // ID Documents
  uploadUserIdPhoto: (data) => req('POST', '/users/upload-id-photo', data, true),

  // Auth — Firebase Phone Auth token exchange
  firebaseVerify: (idToken) => req('POST', '/auth/firebase-verify', { idToken }),

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
  getAdminUsers: () => req('GET', '/admin/users', null, true),
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
  health: () => req('GET', '/health'),
};

export const saveToken = (token) => localStorage.setItem('petclub_token', token);
export const clearToken = () => localStorage.removeItem('petclub_token');
export const hasToken = () => !!getToken();
