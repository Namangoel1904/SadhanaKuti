// API base URL via Vite proxy
const API = '/api';

const getToken = () => localStorage.getItem('token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// Auth
export const register = (body) =>
  fetch(`${API}/auth/register`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const login = (body) =>
  fetch(`${API}/auth/login`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const verifyPasskey = (passkey) =>
  fetch(`${API}/auth/verify-passkey`, { method: 'POST', headers: headers(), body: JSON.stringify({ passkey }) }).then(handleResponse);

export const getMe = () =>
  fetch(`${API}/auth/me`, { headers: headers() }).then(handleResponse);

// Exams
export const getExams = () =>
  fetch(`${API}/exams`, { headers: headers() }).then(handleResponse);

export const createExam = (body) =>
  fetch(`${API}/exams`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const updateExam = (id, body) =>
  fetch(`${API}/exams/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const deleteExam = (id) =>
  fetch(`${API}/exams/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse);

// Messages
export const getMessages = () =>
  fetch(`${API}/messages`, { headers: headers() }).then(handleResponse);

export const deleteMessage = (id) =>
  fetch(`${API}/messages/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse);

// Registrations
export const registerForExam = (formData) =>
  fetch(`${API}/registrations`, {
    method: 'POST',
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: formData,
  }).then(handleResponse);

export const getMyRegistrations = () =>
  fetch(`${API}/registrations/my`, { headers: headers() }).then(handleResponse);

export const getAdminRegistrations = (status) =>
  fetch(`${API}/registrations/admin${status ? `?status=${status}` : ''}`, { headers: headers() }).then(handleResponse);

export const verifyRegistration = (id, status, adminNote) =>
  fetch(`${API}/registrations/${id}/verify`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ status, adminNote }),
  }).then(handleResponse);

export const getAdmitCardData = (registrationId) =>
  fetch(`${API}/registrations/${registrationId}/admit-card-data`, { headers: headers() }).then(handleResponse);

// Question Paper
export const uploadQuestionPaper = (formData) =>
  fetch(`${API}/questionpaper/upload`, {
    method: 'POST',
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: formData,
  }).then(handleResponse);

export const getQuestionPaper = (examId) =>
  fetch(`${API}/questionpaper/${examId}`, { headers: headers() }).then(handleResponse);

export const getQuestionPaperStudent = (examId) =>
  fetch(`${API}/questionpaper/${examId}/student`, { headers: headers() }).then(handleResponse);

// Attempts
export const startAttempt = (examId) =>
  fetch(`${API}/attempts/start`, { method: 'POST', headers: headers(), body: JSON.stringify({ examId }) }).then(handleResponse);

export const submitAttempt = (body) =>
  fetch(`${API}/attempts/submit`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const getMyAttempts = () =>
  fetch(`${API}/attempts/my`, { headers: headers() }).then(handleResponse);

export const getAdminAttempts = () =>
  fetch(`${API}/attempts/admin`, { headers: headers() }).then(handleResponse);

export const getAttemptDetail = (id) =>
  fetch(`${API}/attempts/${id}`, { headers: headers() }).then(handleResponse);

// Admin: All students
export const getAdminStudents = () =>
  fetch(`${API}/attempts/admin/students`, { headers: headers() }).then(handleResponse);
