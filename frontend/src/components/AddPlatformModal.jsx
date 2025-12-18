import React, { useState } from 'react';
import { X } from 'lucide-react';

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'ziprecruiter', label: 'ZipRecruiter' },
  { value: 'monster', label: 'Monster' },
  { value: 'careerbuilder', label: 'CareerBuilder' },
  { value: 'dice', label: 'Dice' },
  { value: 'company_site', label: 'Company Website' },
  { value: 'handshake', label: 'Handshake' },
  { value: 'angellist', label: 'AngelList/Wellfound' },
  { value: 'other', label: 'Other' },
];

function AddPlatformModal({ isOpen, onClose, job, onPlatformAdded }) {
  const [formData, setFormData] = useState({
    platform: '',
    platform_job_id: '',
    application_url: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Only include application_url if it's not empty
      const payload = {
        platform: formData.platform,
        platform_job_id: formData.platform_job_id,
        notes: formData.notes,
      };
      
      // Only add application_url if it has a value
      if (formData.application_url && formData.application_url.trim()) {
        payload.application_url = formData.application_url;
      }
      
      const response = await fetch(
        `http://localhost:3000/platforms/job/${job.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add platform');
      }

      const data = await response.json();
      onPlatformAdded(data);
      handleClose();
    } catch (err) {
      console.error('Error adding platform:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      platform: '',
      platform_job_id: '',
      application_url: '',
      notes: '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Platform</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Job Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Adding platform for:</p>
          <p className="font-semibold text-gray-900">{job?.title || job?.job_title || 'Job not found'}</p>
          <p className="text-sm text-gray-700">{job?.company || job?.company_name || ''}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Platform Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Platform *
            </label>
            <select
              value={formData.platform}
              onChange={(e) =>
                setFormData({ ...formData, platform: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select a platform</option>
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Application URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Application URL (Optional)
            </label>
            <input
              type="text"
              value={formData.application_url}
              onChange={(e) =>
                setFormData({ ...formData, application_url: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Platform Job ID */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Platform Job ID (Optional)
            </label>
            <input
              type="text"
              value={formData.platform_job_id}
              onChange={(e) =>
                setFormData({ ...formData, platform_job_id: e.target.value })
              }
              placeholder="e.g., 12345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Any additional notes about this application..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.platform}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Platform'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPlatformModal;
