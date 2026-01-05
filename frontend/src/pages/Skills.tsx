// src/pages/Skills.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import ProfileSkills from "../components/profile/ProfileSkills";

const API = (import.meta as any).env.VITE_API_URL;

export default function Skills() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setLoading(false);
          return;
        }

        const decoded: any = jwtDecode(token);
        const potentialId = decoded?.sub || decoded?.id || decoded?.userId;

        const res = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validId = res.data?.id || res.data?.userId || potentialId;
        
        if (validId) {
          setCurrentUserId(String(validId));
        }
      } catch (err) {
        console.error('Error fetching user ID:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8 text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8 text-red-600">Unable to load user information. Please log in again.</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Skills</h1>
        <p className="mt-1 text-sm text-gray-600">Showcase your skills.</p>
      </div>

      <div className="mt-6 page-card">
        <div className="page-card-inner">
          <ProfileSkills userId={currentUserId} />
        </div>
      </div>
    </div>
  );
}