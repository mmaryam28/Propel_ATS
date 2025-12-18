import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function Profile() {
  const [profile, setProfile] = useState({ 
    firstname: '',
    lastname: '',
    bio: '', 
    phone: '', 
    role: '',
    location: '',
    title: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  });
  const [savedProfile, setSavedProfile] = useState({ 
    firstname: '',
    lastname: '',
    email: '',
    bio: '', 
    phone: '', 
    role: '',
    location: '',
    title: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    profile_picture: '',
    created_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            email: user.email || '',
            bio: user.bio || '',
            phone: user.phone || '',
            role: user.role || '',
            location: user.location || '',
            title: user.title || '',
            linkedin_url: user.linkedin_url || '',
            github_url: user.github_url || '',
            portfolio_url: user.portfolio_url || '',
            profile_picture: user.profile_picture || '',
            created_at: user.created_at || ''
          };
          setSavedProfile(userData);
          setPreviewUrl(user.profile_picture || null);
          setProfile({
            firstname: userData.firstname,
            lastname: userData.lastname,
            bio: userData.bio,
            phone: userData.phone,
            role: userData.role,
            location: userData.location,
            title: userData.title,
            linkedin_url: userData.linkedin_url,
            github_url: userData.github_url,
            portfolio_url: userData.portfolio_url
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a local preview URL for the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Uploading profile picture with token:', token ? 'present' : 'missing');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${API}/profile/upload-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Upload response:', response.data);

      if (response.data && response.data.profile_picture) {
        const profilePictureUrl = response.data.profile_picture;
        setSavedProfile({ ...savedProfile, profile_picture: profilePictureUrl });
        setPreviewUrl(profilePictureUrl);
        setSelectedFile(null);
        alert('Profile picture updated successfully!');
        // Reload the page to update navbar
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to upload profile picture: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      const token = localStorage.getItem('token');
      console.log('Removing profile picture with token:', token ? 'present' : 'missing');
      const response = await axios.delete(`${API}/profile/remove-picture`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Remove response:', response.data);

      setSavedProfile({ ...savedProfile, profile_picture: '' });
      setPreviewUrl(null);
      setSelectedFile(null);
      alert('Profile picture removed successfully!');
      // Reload the page to update navbar
      window.location.reload();
    } catch (error) {
      console.error('Error removing profile picture:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to remove profile picture: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Send all profile fields to update
      await axios.put(`${API}/auth/me`, {
        firstname: profile.firstname,
        lastname: profile.lastname,
        bio: profile.bio,
        phone: profile.phone,
        role: profile.role,
        location: profile.location,
        title: profile.title,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refetch user data to update the display section
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        const userData = {
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          email: user.email || '',
          bio: user.bio || '',
          phone: user.phone || '',
          role: user.role || '',
          location: user.location || '',
          title: user.title || '',
          linkedin_url: user.linkedin_url || '',
          github_url: user.github_url || '',
          portfolio_url: user.portfolio_url || '',
          profile_picture: user.profile_picture || '',
          created_at: user.created_at || ''
        };
        setSavedProfile(userData);
        setPreviewUrl(user.profile_picture || null);
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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>

      {/* White container (card) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
        {/* Profile Picture Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-sm font-medium">
              Choose Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            {selectedFile && (
              <button
                type="button"
                onClick={handleUploadProfilePicture}
                disabled={uploadingImage}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
              >
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </button>
            )}
            {savedProfile.profile_picture && !selectedFile && (
              <button
                type="button"
                onClick={handleRemoveProfilePicture}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Remove Photo
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (MAX. 5MB)</p>
        </div>

        <form className="space-y-6" onSubmit={handleSave}>
          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="firstname">First Name</label>
              <input
                id="firstname"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="John"
                value={profile.firstname}
                onChange={(e) => setProfile({ ...profile, firstname: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="lastname">Last Name</label>
              <input
                id="lastname"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="Doe"
                value={profile.lastname}
                onChange={(e) => setProfile({ ...profile, lastname: e.target.value })}
              />
            </div>
          </div>

          {/* Title and Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="title">Title</label>
              <input
                id="title"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="Senior Software Engineer"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              />
            </div>
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

          {/* Contact info */}
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
            <div>
              <label className="form-label" htmlFor="location">Location</label>
              <input
                id="location"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="New York, NY"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              />
            </div>
          </div>

          {/* Social links */}
          <div className="space-y-4">
            <div>
              <label className="form-label" htmlFor="linkedin_url">LinkedIn URL</label>
              <input
                id="linkedin_url"
                type="url"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="https://linkedin.com/in/username"
                value={profile.linkedin_url}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="github_url">GitHub URL</label>
              <input
                id="github_url"
                type="url"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="https://github.com/username"
                value={profile.github_url}
                onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="portfolio_url">Portfolio URL</label>
              <input
                id="portfolio_url"
                type="url"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="https://yourportfolio.com"
                value={profile.portfolio_url}
                onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
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
              placeholder="A short bio about yourself..."
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

        {/* Display saved profile information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Current Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{savedProfile.firstname} {savedProfile.lastname}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-900">{savedProfile.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Title:</span>
              <span className="ml-2 text-gray-900">{savedProfile.title || 'Not set'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Role:</span>
              <span className="ml-2 text-gray-900">{savedProfile.role || 'Not set'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2 text-gray-900">{savedProfile.phone || 'Not set'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <span className="ml-2 text-gray-900">{savedProfile.location || 'Not set'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">LinkedIn:</span>
              {savedProfile.linkedin_url ? (
                <a href={savedProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                  {savedProfile.linkedin_url}
                </a>
              ) : (
                <span className="ml-2 text-gray-900">Not set</span>
              )}
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">GitHub:</span>
              {savedProfile.github_url ? (
                <a href={savedProfile.github_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                  {savedProfile.github_url}
                </a>
              ) : (
                <span className="ml-2 text-gray-900">Not set</span>
              )}
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Portfolio:</span>
              {savedProfile.portfolio_url ? (
                <a href={savedProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                  {savedProfile.portfolio_url}
                </a>
              ) : (
                <span className="ml-2 text-gray-900">Not set</span>
              )}
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Bio:</span>
              <p className="ml-2 text-gray-900 mt-1">{savedProfile.bio || 'Not set'}</p>
            </div>
            <div className="md:col-span-2 text-xs text-gray-500">
              <span className="font-medium">Member since:</span>
              <span className="ml-2">{savedProfile.created_at ? new Date(savedProfile.created_at).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
