import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with interceptor for JWT
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Networking Events API
export const networkingEventsAPI = {
  // Events
  getAllEvents: () => api.get('/networking-events'),
  getEventById: (eventId) => api.get(`/networking-events/${eventId}`),
  createEvent: (eventData) => api.post('/networking-events', eventData),
  updateEvent: (eventId, eventData) => api.put(`/networking-events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/networking-events/${eventId}`),
  getEventStats: () => api.get('/networking-events/stats'),
  getFollowUps: () => api.get('/networking-events/follow-ups'),
  
  // Event Connections
  createConnection: (connectionData) => api.post('/networking-events/connections', connectionData),
  updateConnection: (connectionId, connectionData) => 
    api.put(`/networking-events/connections/${connectionId}`, connectionData),
  deleteConnection: (connectionId) => api.delete(`/networking-events/connections/${connectionId}`),
};

// Informational Interviews API
export const informationalInterviewsAPI = {
  getAllInterviews: () => api.get('/informational-interviews'),
  getInterviewById: (interviewId) => api.get(`/informational-interviews/${interviewId}`),
  createInterview: (interviewData) => api.post('/informational-interviews', interviewData),
  updateInterview: (interviewId, interviewData) => 
    api.put(`/informational-interviews/${interviewId}`, interviewData),
  deleteInterview: (interviewId) => api.delete(`/informational-interviews/${interviewId}`),
  getInterviewStats: () => api.get('/informational-interviews/stats'),
  getUpcomingInterviews: () => api.get('/informational-interviews/upcoming'),
  generateOutreach: (outreachData) => api.post('/informational-interviews/generate-outreach', outreachData),
  getPrepFramework: (interviewId) => api.post(`/informational-interviews/${interviewId}/prep-framework`),
};

export default { networkingEventsAPI, informationalInterviewsAPI };
