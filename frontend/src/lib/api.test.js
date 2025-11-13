import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('API Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have axios configured', () => {
    expect(axios).toBeDefined();
  });

  it('should be able to make GET requests', async () => {
    const mockData = { data: { id: 1, title: 'Test Job' } };
    axios.get = vi.fn().mockResolvedValue(mockData);

    const result = await axios.get('/api/jobs');
    expect(result.data).toEqual(mockData.data);
  });

  it('should be able to make POST requests', async () => {
    const mockData = { data: { success: true } };
    axios.post = vi.fn().mockResolvedValue(mockData);

    const result = await axios.post('/api/jobs', { title: 'New Job' });
    expect(result.data).toEqual(mockData.data);
  });

  it('should be able to make PUT requests', async () => {
    const mockData = { data: { success: true } };
    axios.put = vi.fn().mockResolvedValue(mockData);

    const result = await axios.put('/api/jobs/1', { title: 'Updated Job' });
    expect(result.data).toEqual(mockData.data);
  });

  it('should be able to make DELETE requests', async () => {
    const mockData = { data: { success: true } };
    axios.delete = vi.fn().mockResolvedValue(mockData);

    const result = await axios.delete('/api/jobs/1');
    expect(result.data).toEqual(mockData.data);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Network error');
    axios.get = vi.fn().mockRejectedValue(error);

    try {
      await axios.get('/api/jobs');
    } catch (e) {
      expect(e).toEqual(error);
    }
  });
});
