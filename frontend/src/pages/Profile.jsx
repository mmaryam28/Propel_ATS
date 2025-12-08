import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', bio: '', phone: '', role: '' });
  const [savedProfile, setSavedProfile] = useState({ name: '', bio: '', phone: '', role: '', email: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // UC-010: Fetch actual user profile data from the database
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.user) {
          const user = response.data.user;
          const userData = {
            name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
            bio: user.bio || '',
            phone: user.phone || '',
            role: user.role || '',
            email: user.email || ''
          };
          setSavedProfile(userData);
          setProfile({ name: userData.name, bio: '', phone: '', role: '' });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Send bio, phone, and role to update profile
      await axios.put(`${API}/auth/me`, {
        bio: profile.bio,
        phone: profile.phone,
        role: profile.role
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refetch user data to update the display section at bottom
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        const userData = {
          name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
          bio: user.bio || '',
          phone: user.phone || '',
          role: user.role || '',
          email: user.email || ''
        };
        // Update saved profile display
        setSavedProfile(userData);
        // Clear the form fields
        setProfile({ name: userData.name, bio: '', phone: '', role: '' });
      }
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>

      {/* White container (card) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
        <form className="space-y-6" onSubmit={handleSave}>
          {/* Basic info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label" htmlFor="role">Role</label>
              <input
                id="role"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="Frontend Engineer"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
              />
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="(555) 555-5555"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Bio area */}
          <div>
            <label className="form-label" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={4}
              className="input w-full border-gray-300 rounded-md px-3 py-2"
              placeholder="A short bio…"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
            <p className="form-help text-sm text-gray-500 mt-1">
              This appears on your profile.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-#1e88e5 text-white font-medium hover:bg-blue-700 transition"
            >
              Save changes
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-500 text-gray-700 bg-gray-200 font-medium 
                         hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Display profile information */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <p>Name: {savedProfile.name}</p>
          <p>Email: {savedProfile.email}</p>
          <p>Role: {savedProfile.role}</p>
          <p>Bio: {savedProfile.bio}</p>
          <p>Phone: {savedProfile.phone}</p>
        </div>
      </div>
    </div>
  );
}
