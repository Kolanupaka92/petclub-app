const BASE = import.meta.env.VITE_API_URL || 'https://petclub-backend-production.up.railway.app/api';

const getToken = () => localStorage.getItem('petclub_token');

const req = async (method, path, body, requireAuth = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  // Auth
  sendOTP: (phone, countryCode = '91', email) => req('POST', '/auth/send-otp', { phone, countryCode, email }),
  verifyOTP: (phone, otp, countryCode = '91') => req('POST', '/auth/verify-otp', { phone, otp, countryCode }),

  // User
  getMe: () => req('GET', '/users/me', null, true),
  updateMe: (data) => req('PUT', '/users/me', data, true),
  setRole: (role, subRole, name, email, city, pet) =>
    req('POST', '/users/set-role', { role, subRole, name, email, city, pet }, true),

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

  // Professionals
  getProfessionals: (city, role) =>
    req('GET', `/professionals?city=${city || ''}&sub_role=${role || ''}`),
  getMyProProfile: () => req('GET', '/professionals/me', null, true),
  updateMyProProfile: (data) => req('PUT', '/professionals/me', data, true),
  uploadIdPhoto: (data) => req('POST', '/professionals/upload-id-photo', data, true),

  // Admin
  getAdminStats: () => req('GET', '/admin/stats', null, true),
  getAdminUsers: () => req('GET', '/admin/users', null, true),
  getPendingVerifications: () => req('GET', '/admin/pending-verifications', null, true),
  verifyProfessional: (id, action, reason) => req('PUT', `/admin/verify/${id}`, { action, reason }, true),
  suspendUser: (id) => req('PUT', `/admin/users/${id}/suspend`, {}, true),

  // Health
  health: () => req('GET', '/health'),
};

export const saveToken = (token) => localStorage.setItem('petclub_token', token);
export const clearToken = () => localStorage.removeItem('petclub_token');
export const hasToken = () => !!getToken();
