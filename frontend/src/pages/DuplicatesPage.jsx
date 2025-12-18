import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import DuplicateAlert from '../components/DuplicateAlert';

function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + '/duplicates/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch duplicates');
      }

      const data = await response.json();
      setDuplicates(data);
    } catch (err) {
      console.error('Error fetching duplicates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (masterJobId, duplicateJobIds) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + '/duplicates/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          masterJobId,
          duplicateJobIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge duplicates');
      }

      // Refresh duplicates list
      fetchDuplicates();
    } catch (err) {
      console.error('Error merging duplicates:', err);
      alert('Failed to merge jobs: ' + err.message);
    }
  };

  const handleDismiss = async (duplicateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/duplicates/dismiss/${duplicateId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to dismiss duplicate');
      }

      // Remove from list
      setDuplicates(duplicates.filter((d) => d.id !== duplicateId));
    } catch (err) {
      console.error('Error dismissing duplicate:', err);
      alert('Failed to dismiss duplicate: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Jobs
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Duplicate Applications</h1>
            <p className="text-gray-600 mt-2">
              Review and manage potential duplicate job applications
            </p>
          </div>
          <button
            onClick={fetchDuplicates}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Loading duplicates...</p>
        </div>
      ) : duplicates.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Duplicates Found
          </h3>
          <p className="text-gray-600">
            Great job! You don't have any potential duplicate applications at the moment.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Found <strong>{duplicates.length}</strong> potential duplicate
              {duplicates.length > 1 ? 's' : ''}
            </p>
          </div>

          <DuplicateAlert
            duplicates={duplicates}
            onMerge={handleMerge}
            onDismiss={handleDismiss}
          />
        </>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">About Duplicate Detection</h3>
        <p className="text-sm text-gray-700 mb-2">
          Our system automatically detects potential duplicate job applications based on:
        </p>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>Company name similarity (40% weight)</li>
          <li>Job title similarity (35% weight)</li>
          <li>Location match (15% weight)</li>
          <li>Application date proximity (10% weight)</li>
        </ul>
        <p className="text-sm text-gray-700 mt-2">
          When you merge duplicates, all platforms are combined into the master job,
          and the duplicate jobs are marked as merged.
        </p>
      </div>
    </div>
  );
}

export default DuplicatesPage;
