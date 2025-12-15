import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Dev-only auto-login token support: set VITE_DEV_TOKEN into localStorage when running in dev
const DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN;
const IS_DEV = import.meta.env.DEV;

export default function JobMap() {
  const [jobs, setJobs] = useState([]);
  const [homeLocation, setHomeLocation] = useState(null);
  const [homeCoords, setHomeCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    jobType: '',
    maxDistance: '',
    maxTime: '',
  });
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(10);

  useEffect(() => {
    loadMapData();
  }, [filters]);

  // If running locally in dev and a dev token is provided, auto-populate localStorage
  useEffect(() => {
    try {
      if (IS_DEV && DEV_TOKEN) {
        const existing = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token');
        if (!existing) {
          localStorage.setItem('token', DEV_TOKEN);
        }
      }
    } catch (e) {
      // ignore storage errors in constrained environments
    }
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.maxDistance) params.append('maxDistance', filters.maxDistance);
      if (filters.maxTime) params.append('maxTime', filters.maxTime);

      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token');
      const response = await axios.get(`${API}/jobs/map?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });

      setJobs(response.data.jobs);
      setHomeLocation(response.data.homeLocation);
      setHomeCoords(response.data.homeCoords);

      // Center map on home location if available
      if (response.data.homeCoords) {
        setMapCenter([response.data.homeCoords.latitude, response.data.homeCoords.longitude]);
      }
    } catch (err) {
      console.error('Error loading /jobs/map:', err);
      // Axios error handling
      if (err?.response) {
        const status = err.response.status;
        const data = err.response.data;
        setError(`Request failed (${status}): ${data?.message || JSON.stringify(data)}`);
      } else if (err?.request) {
        setError('Network error: no response from server. Check connection/CORS or server status.');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-6">Loading map data...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl text-blue-500 font-bold mb-4">Job Map</h1>
        <p className="text-gray-600 mb-4">
          Visualize your job opportunities on an interactive map. {homeLocation ? `Home location: ${homeLocation}` : 'Set your home location in your profile to see distances.'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg text-blue-500 font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Types</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Distance (km)</label>
            <input
              type="number"
              value={filters.maxDistance}
              onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
              placeholder="e.g. 50"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Drive Time (min)</label>
            <input
              type="number"
              value={filters.maxTime}
              onChange={(e) => handleFilterChange('maxTime', e.target.value)}
              placeholder="e.g. 60"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '600px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {homeCoords && (
            <Marker position={[homeCoords.latitude, homeCoords.longitude]}>
              <Popup>
                <div>
                  <strong>Home: {homeLocation}</strong>
                </div>
              </Popup>
            </Marker>
          )}
          {jobs.map(job => (
            job.latitude && job.longitude ? (
              <Marker key={job.id} position={[job.latitude, job.longitude]}>
                <Popup>
                  <div>
                    <h3 className="font-bold">{job.title}</h3>
                    <p><strong>{job.company}</strong></p>
                    <p>{job.location}</p>
                    {job.distance && <p>Distance: {job.distance.toFixed(1)} km</p>}
                    {job.estimatedTime && <p>Est. drive time: {Math.round(job.estimatedTime)} min</p>}
                    <p>Status: {job.status}</p>
                    <Link to={`/jobs/${job.id}`} className="text-blue-500 underline">View Details</Link>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>

      {/* Job List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg text-blue-500 font-semibold mb-3">Jobs ({jobs.length})</h2>
        <div className="space-y-2">
          {jobs.map(job => (
            <div key={job.id} className="border p-3 rounded flex justify-between items-center">
              <div>
                <h3 className="text-gray-800 font-semibold">{job.title}</h3>
                <p className="text-gray-600">{job.company} • {job.location}</p>
                {job.distance && (
                  <p className="text-sm text-gray-500">
                    {job.distance.toFixed(1)} km away • ~{Math.round(job.estimatedTime)} min drive
                  </p>
                )}
              </div>
              <Link
                to={`/jobs/${job.id}`}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}