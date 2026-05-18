// src/api.js — PETclub API helper
const BASE = 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('petclub_token');

export const api = {
  // Auth
  sendOTP: (phone) => fetch(`${BASE}/auth/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) }).then(r => r.json()),
  verifyOTP: (phone, otp) => fetch(`${BASE}/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }) }).then(r => r.json()),
  // Contact form (website)
  sendAppLink: (data) => fetch(`${BASE}/contact/send-link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  // Pets
  getPets: () => fetch(`${BASE}/pets`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
  addPet: (data) => fetch(`${BASE}/pets`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(data) }).then(r => r.json()),
  // Records
  getRecords: (petId, type) => fetch(`${BASE}/pets/${petId}/records/${type}`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
  addRecord: (petId, type, data) => fetch(`${BASE}/pets/${petId}/records/${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(data) }).then(r => r.json()),
  // Bookings
  getBookings: () => fetch(`${BASE}/bookings`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
  createBooking: (data) => fetch(`${BASE}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(data) }).then(r => r.json()),
  // Professionals
  getProfessionals: (city, role) => fetch(`${BASE}/professionals?city=${city||''}&sub_role=${role||''}`).then(r => r.json()),
};