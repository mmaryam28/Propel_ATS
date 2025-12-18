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

// LinkedIn Auth API
export const linkedinAuthAPI = {
  getAuthUrl: () => api.get('/linkedin-auth/url'),
  getStatus: () => api.get('/linkedin-auth/status'),
  disconnect: () => api.delete('/linkedin-auth/disconnect'),
  importProfile: () => api.post('/linkedin-auth/import-profile'),
  initiateConnect: async () => {
    try {
      // Get userId from JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Decode JWT to get userId
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      console.log('JWT Payload:', payload);
      
      // The JWT contains 'sub' claim which is the userId
      const userId = payload.sub;
      console.log('Extracted userId for LinkedIn connect:', userId);
      
      if (!userId) {
        throw new Error('Could not extract userId from token - sub claim is missing');
      }
      
      // Redirect directly to the connect endpoint which uses the linkedin-networking strategy
      window.location.href = `${API_URL}/linkedin-auth/connect?state=${encodeURIComponent(userId)}`;
    } catch (error) {
      console.error('Failed to initiate LinkedIn connection:', error);
      throw error;
    }
  },
};

// Contacts API
export const contactsAPI = {
  // Get all contacts with optional filters
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.company) params.append('company', filters.company);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.relationshipType) params.append('relationshipType', filters.relationshipType);
    
    return api.get(`/contacts${params.toString() ? '?' + params.toString() : ''}`);
  },

  // Get contact by ID
  getById: (id) => api.get(`/contacts/${id}`),

  // Create new contact
  create: (data) => api.post('/contacts', data),

  // Update contact
  update: (id, data) => api.put(`/contacts/${id}`, data),

  // Delete contact
  delete: (id) => api.delete(`/contacts/${id}`),

  // Get contact statistics
  getStats: () => api.get('/contacts/stats'),

  // Get contact interactions
  getInteractions: (contactId) => api.get(`/contacts/${contactId}/interactions`),

  // Create interaction
  createInteraction: (data) => api.post('/contacts/interactions', data),

  // Update interaction
  updateInteraction: (id, data) => api.put(`/contacts/interactions/${id}`, data),

  // Delete interaction
  deleteInteraction: (id) => api.delete(`/contacts/interactions/${id}`),
};

// Discovery API
export const discoveryAPI = {
  // Get suggested contacts
  getSuggestions: () => api.get('/discovery/suggestions'),

  // Get connection path for a suggested contact
  getConnectionPath: (contactId) => api.get(`/discovery/path/${contactId}`),

  // Track action on a suggestion
  trackAction: (data) => api.post('/discovery/track', data),
};

export default api;
