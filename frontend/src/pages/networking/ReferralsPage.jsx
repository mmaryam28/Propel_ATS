import React, { useState, useEffect } from 'react';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import referralsAPI from '../../api/referrals';
import { listJobs } from '../../lib/api';
import ReferralCard from '../../components/networking/ReferralCard';
import ReferralRequestModal from '../../components/networking/ReferralRequestModal';

const ReferralsPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    jobId: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [referralsData, jobsData, statsData] = await Promise.all([
        referralsAPI.getAllReferrals(filters),
        listJobs(),
        referralsAPI.getReferralStats(),
      ]);
      setReferrals(referralsData);
      setJobs(jobsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError(err.response?.data?.message || 'Failed to fetch referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = () => {
    setSelectedReferral(null);
    setShowModal(true);
  };

  const handleEditReferral = (referral) => {
    setSelectedReferral(referral);
    setShowModal(true);
  };

  const handleDeleteReferral = async (referralId) => {
    if (!window.confirm('Are you sure you want to delete this referral request?')) {
      return;
    }
    try {
      await referralsAPI.deleteReferral(referralId);
      fetchData();
    } catch (err) {
      console.error('Error deleting referral:', err);
      alert(err.response?.data?.message || 'Failed to delete referral');
    }
  };

  const handleModalClose = (refreshNeeded) => {
    setShowModal(false);
    setSelectedReferral(null);
    if (refreshNeeded) {
      fetchData();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      jobId: '',
    });
  };

  if (loading && !referrals.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading referrals...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Requests</h1>
            <p className="text-gray-600 mt-1">
              Track and manage referral requests for your job applications
            </p>
          </div>
          <button
            onClick={handleCreateReferral}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Referral Request
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Requests</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Sent</div>
              <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex items-center gap-4">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="responded">Responded</option>
            </select>
            <select
              name="jobId"
              value={filters.jobId}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 flex-1"
            >
              <option value="">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} at {job.company}
                </option>
              ))}
            </select>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Referrals List */}
      <div className="space-y-4">
        {referrals.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 mb-4">No referral requests found</p>
            <button
              onClick={handleCreateReferral}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Your First Referral Request
            </button>
          </div>
        ) : (
          referrals.map(referral => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              onEdit={() => handleEditReferral(referral)}
              onDelete={() => handleDeleteReferral(referral.id)}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ReferralRequestModal
          referral={selectedReferral}
          jobs={jobs}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ReferralsPage;
