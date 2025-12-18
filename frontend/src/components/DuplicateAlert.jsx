import React, { useState } from 'react';
import { AlertCircle, X, ExternalLink, Merge } from 'lucide-react';

function DuplicateAlert({ duplicates, onMerge, onDismiss }) {
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);
  const [masterJobId, setMasterJobId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!duplicates || duplicates.length === 0) {
    return null;
  }

  const handleToggleDuplicate = (jobId) => {
    setSelectedDuplicates((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleMerge = async () => {
    if (!masterJobId || selectedDuplicates.length === 0) return;

    setLoading(true);
    try {
      await onMerge(masterJobId, selectedDuplicates);
      setSelectedDuplicates([]);
      setMasterJobId('');
    } catch (error) {
      console.error('Error merging duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="text-yellow-600 mt-1 mr-3" size={20} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Potential Duplicate Applications Detected
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            We found {duplicates.length} job{duplicates.length > 1 ? 's' : ''} that
            may be duplicates. Review and merge them to keep your tracker organized.
          </p>

          <div className="space-y-3">
            {duplicates.map((duplicate) => (
              <div
                key={duplicate.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedDuplicates.includes(duplicate.job2.id)}
                      onChange={() => handleToggleDuplicate(duplicate.job2.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {duplicate.job2.job_title}
                        </h4>
                        <span className="text-sm font-medium text-blue-600">
                          {Math.round(duplicate.similarity_score * 100)}% match
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {duplicate.job2.company_name}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Company: {Math.round(duplicate.company_match * 100)}%
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          Title: {Math.round(duplicate.title_match * 100)}%
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          Location: {Math.round(duplicate.location_match * 100)}%
                        </span>
                      </div>
                      {duplicate.job2.application_url && (
                        <a
                          href={duplicate.job2.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          View Application
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(duplicate.id)}
                    className="ml-3 text-gray-400 hover:text-gray-600"
                    title="Not a duplicate"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Section */}
          {selectedDuplicates.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Merge size={18} className="mr-2" />
                Merge Selected Duplicates
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                Select which job to keep as the master (all platforms will be merged
                into this job):
              </p>
              <div className="space-y-2 mb-4">
                {duplicates
                  .filter((d) => selectedDuplicates.includes(d.job2.id))
                  .map((duplicate) => (
                    <label key={duplicate.job2.id} className="flex items-center">
                      <input
                        type="radio"
                        name="masterJob"
                        value={duplicate.job2.id}
                        checked={masterJobId === duplicate.job2.id}
                        onChange={(e) => setMasterJobId(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">
                        {duplicate.job2.job_title} at {duplicate.job2.company_name}
                      </span>
                    </label>
                  ))}
              </div>
              <button
                onClick={handleMerge}
                disabled={!masterJobId || loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Merging...' : `Merge ${selectedDuplicates.length} Jobs`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DuplicateAlert;
