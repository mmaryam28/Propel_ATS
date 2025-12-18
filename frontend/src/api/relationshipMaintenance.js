import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Relationship Maintenance API
export const relationshipMaintenanceAPI = {
  // Get suggested contacts
  getSuggestedContacts: () => api.get('/relationship-maintenance/suggestions'),

  // Get connection path
  getConnectionPath: (contactId) => api.get(`/relationship-maintenance/connection-path/${contactId}`),

  // Get reminders
  getReminders: (status) =>
    api.get('/relationship-maintenance/reminders', { params: { status } }),

  // Get upcoming reminders
  getUpcomingReminders: () => api.get('/relationship-maintenance/reminders/upcoming'),

  // Get overdue reminders
  getOverdueReminders: () => api.get('/relationship-maintenance/reminders/overdue'),

  // Get health scores
  getHealthScores: () => api.get('/relationship-maintenance/health-scores'),

  // Create reminder
  createReminder: (data) => api.post('/relationship-maintenance/reminders', data),

  // Auto-generate reminders
  autoGenerateReminders: (days) =>
    api.post('/relationship-maintenance/reminders/auto-generate', null, { params: { days } }),

  // Update reminder
  updateReminder: (id, data) => api.put(`/relationship-maintenance/reminders/${id}`, data),

  // Delete reminder
  deleteReminder: (id) => api.delete(`/relationship-maintenance/reminders/${id}`),
};

export default api;
