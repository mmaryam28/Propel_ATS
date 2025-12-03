import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { referencesAPI } from '../../api/references';

export default function ReferenceRequestModal({ reference, request, onClose }) {
  const [formData, setFormData] = useState({
    jobId: '',
    talkingPoints: '',
    dueDate: '',
  });
  const [interestedJobs, setInterestedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInterestedJobs();
    
    // If editing, pre-fill form data
    if (request) {
      // Extract job ID from talking_points metadata [JOB:id|title|company]
      const match = request.talking_points?.match(/\[JOB:([^|]+)\|/);
      const jobId = match ? match[1] : '';
      
      // Remove the metadata prefix from talking points
      const cleanTalkingPoints = request.talking_points
        ?.replace(/\[JOB:[^\]]+\]\n\n/, '') || '';
      
      setFormData({
        jobId: jobId,
        talkingPoints: cleanTalkingPoints,
        dueDate: request.due_date ? new Date(request.due_date).toISOString().split('T')[0] : '',
      });
    }
  }, [request]);

  const fetchInterestedJobs = async () => {
    try {
      const response = await referencesAPI.getInterestedJobs();
      setInterestedJobs(response.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (request) {
        // Update existing request
        await referencesAPI.updateRequest(request.id, {
          talkingPoints: formData.talkingPoints,
          dueDate: formData.dueDate || undefined,
        });
      } else {
        // Create new request
        await referencesAPI.createRequest({
          referenceId: reference.id,
          jobId: formData.jobId || undefined,
          talkingPoints: formData.talkingPoints,
          dueDate: formData.dueDate || undefined,
        });
      }
      onClose(true);
    } catch (err) {
      console.error('Error saving request:', err);
      setError(err.response?.data?.message || `Failed to ${request ? 'update' : 'create'} reference request`);
    } finally {
      setLoading(false);
    }
  };

  const contact = reference.professional_contacts;
  const selectedJob = interestedJobs.find(job => job.id === formData.jobId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {request ? 'Edit Reference Request' : 'Request Reference'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">From {contact?.full_name}</p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
              {/* Job Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Application {request && <span className="text-xs text-gray-500">(Cannot be changed after creation)</span>}
                </label>
                <select
                  name="jobId"
                  value={formData.jobId}
                  onChange={handleChange}
                  disabled={!!request}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a job from your pipeline...</option>
                  {interestedJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.company}
                      {job.location && ` - ${job.location}`}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Only showing jobs in "Interested" status from your pipeline
                </p>
                {selectedJob && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-900">
                      Selected: {selectedJob.title} at {selectedJob.company}
                    </p>
                    {selectedJob.location && (
                      <p className="text-xs text-blue-700 mt-1">
                        Location: {selectedJob.location}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Talking Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Talking Points
                </label>
                <textarea
                  name="talkingPoints"
                  value={formData.talkingPoints}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Key points you'd like your reference to mention..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (request ? 'Updating...' : 'Creating...') : (request ? 'Update Request' : 'Create Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
