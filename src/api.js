// api.mypetclub.app domain mapping active — SSL cert provisioning by Google (~60min)
// Fallback to direct Cloud Run URL until custom domain SSL is ready
const BASE = import.meta.env.VITE_API_URL || 'https://petclub-backend-1084002294076.us-central1.run.app/api';

const getToken = () => localStorage.getItem('petclub_token');

const req = async (method, path, body, requireAuth = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Safely parse JSON — handles empty bodies & rate-limit HTML responses
  let data = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`Server error (${res.status}). Please try again.`);
    return {};
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

export const api = {
  // Auth
  sendOTP: (phone, countryCode = '91', email) => req('POST', '/auth/send-otp', { phone, countryCode, email }),
  verifyOTP: (phone, otp, countryCode = '91') => req('POST', '/auth/verify-otp', { phone, otp, countryCode }),

  // User
  getMe: () => req('GET', '/users/me', null, true),
  updateMe: (data) => req('PUT', '/users/me', data, true),
  setRole: (role, subRole, name, email, city, address, pet) =>
    req('POST', '/users/set-role', { role, subRole, name, email, city, address, pet }, true),

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
  updateMyProProfile: (data) => req('PUT', '/professionals/me', data, true),
  uploadIdPhoto: (data) => req('POST', '/professionals/upload-id-photo', data, true),
  setAvailability: (is_available) => req('PUT', '/professionals/availability', { is_available }, true),

  // Live Tracking
  updateLocation: (id, lat, lng) => req('POST', `/bookings/${id}/location`, { lat, lng }, true),
  getTracking:    (id)           => req('GET',  `/bookings/${id}/tracking`, null, true),

  // Ratings
  rateBooking: (id, rating, review) => req('POST', `/bookings/${id}/rate`, { rating, review }, true),
  getMyRating: (id) => req('GET', `/bookings/${id}/my-rating`, null, true),

  // ID Documents
  uploadUserIdPhoto: (data) => req('POST', '/users/upload-id-photo', data, true),

  // Push Notifications (FCM)
  saveFcmToken: (token) => req('POST', '/users/fcm-token', { token }, true),

  // Payments (Razorpay — active after LLC registration)
  getPaymentConfig: () => req('GET', '/payments/config', null, true),
  createPaymentOrder: (amount, bookingId, notes) => req('POST', '/payments/create-order', { amount, bookingId, notes }, true),
  verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId) =>
    req('POST', '/payments/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }, true),

  // Admin
  getAdminStats: () => req('GET', '/admin/stats', null, true),
  getAdminUsers: () => req('GET', '/admin/users', null, true),
  getPendingVerifications: () => req('GET', '/admin/pending-verifications', null, true),
  verifyProfessional: (id, action, reason) => req('PUT', `/admin/verify/${id}`, { action, reason }, true),
  suspendUser: (id) => req('PUT', `/admin/users/${id}/suspend`, {}, true),
  setUserSubRole: (id, subRole) => req('PUT', `/admin/users/${id}/set-role`, { subRole }, true),
  // Admin testing tools
  getOtp: (phone, cc = '91') => req('GET', `/admin/otp?phone=${encodeURIComponent(phone)}&cc=${cc}`, null, true),

  // Health
  health: () => req('GET', '/health'),
};

export const saveToken = (token) => localStorage.setItem('petclub_token', token);
export const clearToken = () => localStorage.removeItem('petclub_token');
export const hasToken = () => !!getToken();
