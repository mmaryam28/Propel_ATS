import { useState, useEffect } from 'react';
import { XMarkIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { discoveryAPI } from '../../api/networking';

export default function ConnectionPathModal({ suggestion, onClose, onConnect }) {
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectionPath();
  }, [suggestion.id]);

  const fetchConnectionPath = async () => {
    try {
      setLoading(true);
      const response = await discoveryAPI.getConnectionPath(suggestion.id);
      setPathData(response.data);
    } catch (error) {
      console.error('Error fetching connection path:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">Connection Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-500">Loading connection details...</p>
            </div>
          ) : pathData ? (
            <>
              {/* Suggested Contact Info */}
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {pathData.suggestedContact.full_name}
                </h3>
                {pathData.suggestedContact.headline && (
                  <p className="text-sm text-gray-600 mb-2">{pathData.suggestedContact.headline}</p>
                )}
                <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                  {pathData.suggestedContact.company && (
                    <span className="inline-flex items-center px-2 py-1 bg-white rounded">
                      📍 {pathData.suggestedContact.company}
                    </span>
                  )}
                  {pathData.suggestedContact.role && (
                    <span className="inline-flex items-center px-2 py-1 bg-white rounded">
                      💼 {pathData.suggestedContact.role}
                    </span>
                  )}
                  {pathData.suggestedContact.industry && (
                    <span className="inline-flex items-center px-2 py-1 bg-white rounded">
                      🏢 {pathData.suggestedContact.industry}
                    </span>
                  )}
                </div>
                {pathData.suggestedContact.linkedin_profile_url && (
                  <a
                    href={pathData.suggestedContact.linkedin_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    View LinkedIn Profile →
                  </a>
                )}
              </div>

              {/* Connection Path */}
              {pathData.path && pathData.path.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Connection Path</h4>
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                      You
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                    {pathData.path.map((contact, index) => (
                      <div key={contact.id}>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg">
                          <p className="font-medium text-gray-900">{contact.full_name}</p>
                          {contact.company && (
                            <p className="text-xs text-gray-600">{contact.company}</p>
                          )}
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-gray-400 inline mx-2" />
                      </div>
                    ))}
                    <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                      {pathData.suggestedContact.full_name}
                    </div>
                  </div>
                </div>
              )}

              {/* Mutual Connections */}
              {pathData.mutualConnections && pathData.mutualConnections.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    Mutual Connections ({pathData.mutualConnections.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pathData.mutualConnections.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{contact.full_name}</p>
                        {contact.company && (
                          <p className="text-sm text-gray-600">{contact.company}</p>
                        )}
                        {contact.role && (
                          <p className="text-xs text-gray-500">{contact.role}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why This Suggestion */}
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Why This Suggestion?</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className={`mr-2 ${suggestion.scoringDetails.hasMutualConnections ? 'text-green-600' : 'text-gray-400'}`}>
                      {suggestion.scoringDetails.hasMutualConnections ? '✓' : '○'}
                    </span>
                    <span>Has {pathData.mutualConnections.length} mutual connection(s)</span>
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${suggestion.scoringDetails.sameIndustry ? 'text-green-600' : 'text-gray-400'}`}>
                      {suggestion.scoringDetails.sameIndustry ? '✓' : '○'}
                    </span>
                    <span>Works in your industry</span>
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${suggestion.scoringDetails.inTargetCompany ? 'text-green-600' : 'text-gray-400'}`}>
                      {suggestion.scoringDetails.inTargetCompany ? '✓' : '○'}
                    </span>
                    <span>Works at a target company</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onConnect(suggestion);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add to Contacts
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No connection data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
