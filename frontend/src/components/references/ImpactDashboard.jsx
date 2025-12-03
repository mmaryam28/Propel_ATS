import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { referencesAPI } from '../../api/references';

export default function ImpactDashboard({ onClose }) {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpact();
  }, []);

  const fetchImpact = async () => {
    try {
      setLoading(true);
      const response = await referencesAPI.getImpact();
      setImpact(response.data);
    } catch (err) {
      console.error('Error fetching impact:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Reference Impact Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading impact data...</p>
            </div>
          ) : impact ? (
            <div className="space-y-6">
              {/* Application Coverage */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Pipeline Coverage</h3>
                <p className="text-sm text-gray-600 mb-4">Tracking references requested for jobs in "Interested" status</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{impact.totalApplications}</p>
                    <p className="text-sm text-gray-600 mt-1">Interested Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{impact.applicationsWithReferences}</p>
                    <p className="text-sm text-gray-600 mt-1">With References</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{impact.applicationsWithoutReferences}</p>
                    <p className="text-sm text-gray-600 mt-1">Without References</p>
                  </div>
                </div>
                {impact.totalApplications > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full transition-all"
                        style={{ 
                          width: `${(impact.applicationsWithReferences / impact.totalApplications) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {Math.round((impact.applicationsWithReferences / impact.totalApplications) * 100)}% 
                      of applications have references
                    </p>
                  </div>
                )}
              </div>

              {/* Reference Types Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reference Types</h3>
                {Object.keys(impact.referencesByType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(impact.referencesByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="text-sm font-medium text-gray-700 capitalize w-32">
                            {type}
                          </span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ 
                                  width: `${(count / Math.max(...Object.values(impact.referencesByType))) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No reference types data available</p>
                )}
              </div>

              {/* Insights */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Insights</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {impact.applicationsWithoutReferences > 0 && (
                    <li>• You have {impact.applicationsWithoutReferences} interested job(s) without reference requests. Request references to strengthen your applications!</li>
                  )}
                  {impact.applicationsWithReferences === 0 && impact.totalApplications > 0 && (
                    <li>• Consider requesting references for your interested jobs to significantly improve your chances of getting interviews.</li>
                  )}
                  {Object.keys(impact.referencesByType).length < 2 && (
                    <li>• Diversify your reference types (professional, manager, colleague, etc.) for a well-rounded profile.</li>
                  )}
                  {impact.totalApplications === 0 && (
                    <li>• Add jobs with "Interested" status in your pipeline, then request references for them to track your coverage.</li>
                  )}
                  {impact.applicationsWithReferences > 0 && (
                    <li>• Great job! {Math.round((impact.applicationsWithReferences / impact.totalApplications) * 100)}% of your interested jobs have reference requests.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600 py-12">No impact data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
