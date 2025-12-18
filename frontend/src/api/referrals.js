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

// Base referrals endpoint
const BASE_URL = '/referrals';

/**
 * Get all referral requests with optional filters
 * @param {Object} filters - { status, jobId }
 */
export const getAllReferrals = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.jobId) params.append('jobId', filters.jobId);
  
  const response = await api.get(`${BASE_URL}?${params.toString()}`);
  return response.data;
};

/**
 * Get a single referral request by ID
 * @param {string} referralId
 */
export const getReferralById = async (referralId) => {
  const response = await api.get(`${BASE_URL}/${referralId}`);
  return response.data;
};

/**
 * Get referral statistics
 */
export const getReferralStats = async () => {
  const response = await api.get(`${BASE_URL}/stats`);
  return response.data;
};

/**
 * Get referrals needing follow-up
 */
export const getFollowUps = async () => {
  const response = await api.get(`${BASE_URL}/follow-up`);
  return response.data;
};

/**
 * Generate referral request template
 * @param {Object} data - { jobId, contactId }
 */
export const generateTemplate = async (data) => {
  const response = await api.post(`${BASE_URL}/generate-template`, data);
  return response.data;
};

/**
 * Create a new referral request
 * @param {Object} data - { jobId, contactId, requestTemplate, notes }
 */
export const createReferral = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response.data;
};

/**
 * Update a referral request
 * @param {string} referralId
 * @param {Object} data - { status, requestTemplate, sentDate, followUpDate, followUpCount, responseDate, responseType, notes }
 */
export const updateReferral = async (referralId, data) => {
  const response = await api.put(`${BASE_URL}/${referralId}`, data);
  return response.data;
};

/**
 * Delete a referral request
 * @param {string} referralId
 */
export const deleteReferral = async (referralId) => {
  const response = await api.delete(`${BASE_URL}/${referralId}`);
  return response.data;
};

/**
 * Get referral request history
 * @param {string} referralId
 */
export const getReferralHistory = async (referralId) => {
  const response = await api.get(`${BASE_URL}/${referralId}/history`);
  return response.data;
};

const referralsAPI = {
  getAllReferrals,
  getReferralById,
  getReferralStats,
  getFollowUps,
  generateTemplate,
  createReferral,
  updateReferral,
  deleteReferral,
  getReferralHistory,
};

export default referralsAPI;
