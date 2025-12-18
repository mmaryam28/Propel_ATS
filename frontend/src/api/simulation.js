import api from './axiosConfig';

export const simulationApi = {
  // Create a new simulation
  createSimulation: (data) => api.post('/simulation', data),

  // Get all simulations
  listSimulations: () => api.get('/simulation'),

  // Get a specific simulation
  getSimulation: (id) => api.get(`/simulation/${id}`),

  // Update simulation preferences
  updateSimulation: (id, data) => api.put(`/simulation/${id}`, data),

  // Delete simulation
  deleteSimulation: (id) => api.delete(`/simulation/${id}`),

  // Get career role templates
  getCareerTemplates: (industry) => 
    api.get(industry ? `/simulation/templates/${industry}` : '/simulation/templates'),
};
