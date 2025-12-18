import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function Offers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState([]);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    remote_policy: 'hybrid',
    base_salary: '',
    bonus: '',
    signing_bonus: '',
    equity_value: '',
    equity_type: 'RSU',
    equity_vesting_years: 4,
    health_insurance_value: '',
    retirement_match_percent: '',
    pto_days: '',
    culture_fit_score: 5,
    growth_opportunities_score: 5,
    work_life_balance_score: 5,
    team_quality_score: 5,
    mission_alignment_score: 5,
    status: 'evaluating',
    offer_deadline: '',
    pros: '',
    cons: '',
    notes: '',
  });

  useEffect(() => {
    loadOffers();
  }, [statusFilter]);

  const loadOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API}/offers${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOffers(response.data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
      showMessage('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingOffer) {
        await axios.put(`${API}/offers/${editingOffer.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('Offer updated successfully!');
      } else {
        await axios.post(`${API}/offers`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('Offer created successfully!');
      }
      
      setShowModal(false);
      setEditingOffer(null);
      resetForm();
      loadOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
      showMessage('Failed to save offer', 'error');
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData(offer);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Offer deleted successfully!');
      loadOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      showMessage('Failed to delete offer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      location: '',
      remote_policy: 'hybrid',
      base_salary: '',
      bonus: '',
      signing_bonus: '',
      equity_value: '',
      equity_type: 'RSU',
      equity_vesting_years: 4,
      health_insurance_value: '',
      retirement_match_percent: '',
      pto_days: '',
      culture_fit_score: 5,
      growth_opportunities_score: 5,
      work_life_balance_score: 5,
      team_quality_score: 5,
      mission_alignment_score: 5,
      status: 'evaluating',
      offer_deadline: '',
      pros: '',
      cons: '',
      notes: '',
    });
  };

  const toggleSelectOffer = (id) => {
    setSelectedOffers(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedOffers.length < 2) {
      showMessage('Please select at least 2 offers to compare', 'error');
      return;
    }
    navigate(`/offers/compare?ids=${selectedOffers.join(',')}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      evaluating: 'bg-yellow-100 text-black',
      negotiating: 'bg-blue-100 text-black',
      accepted: 'bg-green-100 text-black',
      declined: 'bg-red-100 text-black',
    };
    return colors[status] || 'bg-gray-100 text-black';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading offers...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Job Offers</h1>
          <p className="text-gray-600 mt-1">Compare and evaluate your offers</p>
        </div>
        <div className="flex gap-3">
          {compareMode && selectedOffers.length > 0 && (
            <button
              onClick={handleCompare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Compare ({selectedOffers.length})
            </button>
          )}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 rounded-lg ${
              compareMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {compareMode ? 'Cancel Compare' : 'Compare Mode'}
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingOffer(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Offer
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Statuses</option>
          <option value="evaluating">Evaluating</option>
          <option value="negotiating">Negotiating</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No offers yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Your First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <div
              key={offer.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                selectedOffers.includes(offer.id) ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              {compareMode && (
                <input
                  type="checkbox"
                  checked={selectedOffers.includes(offer.id)}
                  onChange={() => toggleSelectOffer(offer.id)}
                  className="mb-3"
                />
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-black">{offer.company}</h3>
                  <p className="text-gray-600">{offer.position}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(offer.status)}`}>
                  {offer.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Salary:</span>
                  <span className="font-semibold">{formatCurrency(offer.base_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Comp:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(offer.total_compensation)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">COL Adjusted:</span>
                  <span className="font-semibold">{formatCurrency(offer.col_adjusted_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-semibold">{offer.weighted_score?.toFixed(1)}/10</span>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <div>📍 {offer.location}</div>
                <div>💼 {offer.remote_policy?.replace('_', ' ')}</div>
                {offer.offer_deadline && (
                  <div>⏰ Deadline: {new Date(offer.offer_deadline).toLocaleDateString()}</div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(offer)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => navigate(`/offers/${offer.id}`)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Details
                </button>
                <button
                  onClick={() => handleDelete(offer.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Offer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingOffer ? 'Edit Offer' : 'Add New Offer'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company *</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position *</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., San Francisco, CA"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remote Policy</label>
                  <select
                    value={formData.remote_policy}
                    onChange={(e) => setFormData({...formData, remote_policy: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="fully_remote">Fully Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h3 className="font-semibold mb-3">Compensation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Base Salary *</label>
                    <input
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Bonus</label>
                    <input
                      type="number"
                      value={formData.bonus}
                      onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Signing Bonus</label>
                    <input
                      type="number"
                      value={formData.signing_bonus}
                      onChange={(e) => setFormData({...formData, signing_bonus: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Equity Value</label>
                    <input
                      type="number"
                      value={formData.equity_value}
                      onChange={(e) => setFormData({...formData, equity_value: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="font-semibold mb-3">Benefits</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Health Insurance Value</label>
                    <input
                      type="number"
                      value={formData.health_insurance_value}
                      onChange={(e) => setFormData({...formData, health_insurance_value: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">401k Match %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.retirement_match_percent}
                      onChange={(e) => setFormData({...formData, retirement_match_percent: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">PTO Days</label>
                    <input
                      type="number"
                      value={formData.pto_days}
                      onChange={(e) => setFormData({...formData, pto_days: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Scoring */}
              <div>
                <h3 className="font-semibold mb-3">Evaluation Scores (0-10)</h3>
                <div className="space-y-3">
                  {[
                    { key: 'culture_fit_score', label: 'Culture Fit' },
                    { key: 'growth_opportunities_score', label: 'Growth Opportunities' },
                    { key: 'work_life_balance_score', label: 'Work-Life Balance' },
                    { key: 'team_quality_score', label: 'Team Quality' },
                    { key: 'mission_alignment_score', label: 'Mission Alignment' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1">
                        {label}: {formData[key]}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={formData[key]}
                        onChange={(e) => setFormData({...formData, [key]: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="evaluating">Evaluating</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Offer Deadline</label>
                  <input
                    type="date"
                    value={formData.offer_deadline}
                    onChange={(e) => setFormData({...formData, offer_deadline: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pros</label>
                  <textarea
                    value={formData.pros}
                    onChange={(e) => setFormData({...formData, pros: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cons</label>
                  <textarea
                    value={formData.cons}
                    onChange={(e) => setFormData({...formData, cons: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOffer(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
