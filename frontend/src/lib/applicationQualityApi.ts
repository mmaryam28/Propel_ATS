import axios from 'axios';

const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : 'https://cs490-backend.onrender.com';

export async function getApplicationQualityScore({ resume, coverLetter, linkedIn, jobDescription, userId, jobId }) {
  const { data } = await axios.post(`${API_BASE_URL}/application-quality/score`, {
    resume,
    coverLetter,
    linkedIn,
    jobDescription,
    userId,
    jobId,
  });
  return data;
}
