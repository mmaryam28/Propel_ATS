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

export const referencesAPI = {
  // References CRUD
  getAllReferences: () => api.get('/references'),
  getReferenceById: (referenceId) => api.get(`/references/${referenceId}`),
  createReference: (referenceData) => api.post('/references', referenceData),
  updateReference: (referenceId, referenceData) => 
    api.put(`/references/${referenceId}`, referenceData),
  deleteReference: (referenceId) => api.delete(`/references/${referenceId}`),
  
  // Stats
  getStats: () => api.get('/references/stats'),
  getImpact: () => api.get('/references/impact'),
  
  // Reference Requests
  getAllRequests: () => api.get('/references/requests/all'),
  createRequest: (requestData) => api.post('/references/requests', requestData),
  updateRequest: (requestId, requestData) => 
    api.put(`/references/requests/${requestId}`, requestData),
  deleteRequest: (requestId) => api.delete(`/references/requests/${requestId}`),
  
  // Prep Materials & Templates
  generatePrepMaterials: (referenceId, jobApplicationId) => 
    api.post(`/references/${referenceId}/prep-materials`, { jobApplicationId }),
  
  // Get interested jobs from pipeline
  getInterestedJobs: () => api.get('/references/interested-jobs'),
};

export default referencesAPI;
