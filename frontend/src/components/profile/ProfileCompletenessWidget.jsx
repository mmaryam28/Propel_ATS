import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

const API = import.meta?.env?.VITE_API_URL || 'https://cs490-backend.onrender.com';

const ProfileCompletenessWidget = () => {
  const [completeness, setCompleteness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    fetchCompleteness();
  }, []);

  const fetchCompleteness = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/profile/completeness`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompleteness(response.data);
    } catch (err) {
      console.error('Error fetching profile completeness:', err);
      setError('Failed to load profile completeness data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (percentage) => {
    if (percentage >= 90) return 'text-green-700';
    if (percentage >= 75) return 'text-blue-700';
    if (percentage >= 50) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getSectionIcon = (sectionName) => {
    const icons = {
      'Basic Information': 'user',
      'Employment History': 'briefcase',
      'Education': 'education',
      'Skills': 'star',
      'Projects': 'projects',
      'Certifications': 'certifications'
    };
    return icons[sectionName] || 'check-circle';
  };

  const getSectionLink = (sectionName) => {
    const links = {
      'Basic Information': '/profile',
      'Employment History': '/employment',
      'Education': '/education',
      'Skills': '/skills',
      'Projects': '/projects',
      'Certifications': '/certifications'
    };
    return links[sectionName] || '/profile';
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <Card.Body>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </Card.Body>
      </Card>
    );
  }

  if (error || !completeness) {
    return (
      <Card>
        <Card.Body>
          <p className="text-red-500 text-sm">{error || 'Unable to load profile completeness'}</p>
        </Card.Body>
      </Card>
    );
  }

  const { overallPercentage, sections, badges, recommendations, industryBenchmark } = completeness;

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>Profile Completeness</Card.Title>
              <Card.Description>
                Complete your profile to increase visibility and job matches
              </Card.Description>
            </div>
            <div className={`text-4xl font-bold ${getScoreTextColor(overallPercentage)}`}>
              {overallPercentage}%
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Progress Bar */}
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor(overallPercentage)} transition-all duration-500 ease-out flex items-center justify-end pr-3`}
              style={{ width: `${overallPercentage}%` }}
            >
              {overallPercentage > 10 && (
                <span className="text-gray-900 text-xs font-semibold">{overallPercentage}%</span>
              )}
            </div>
          </div>

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Achievements Unlocked:</p>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
                  >
                    <span className="mr-1.5">{badge === 'Getting Started' ? '🌱' : badge === 'Profile Builder' ? '🏗️' : badge === 'Profile Expert' ? '⭐' : badge === 'All-Star Profile' ? '🌟' : '🏆'}</span>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Industry Benchmark */}
          {industryBenchmark && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Industry Comparison</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Your profile is stronger than {industryBenchmark.percentile}% of users in your industry
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{industryBenchmark.percentile}%</div>
                  <div className="text-xs text-gray-500">
                    Avg: {industryBenchmark.industryAverage}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Section Breakdown */}
      <Card>
        <Card.Header>
          <Card.Title>Section Breakdown</Card.Title>
          <Card.Description>Click each section to see details and improvement tips</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            {sections && Object.values(sections).map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.name ? null : section.name)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon name={getSectionIcon(section.name)} size="sm" />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{section.name}</span>
                        {section.completed ? (
                          <Icon name="check-circle" size="sm" className="text-green-500" />
                        ) : (
                          <span className="text-xs text-red-700 font-medium">Required fields missing</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {section.score} / {section.maxScore} points
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreTextColor(section.percentage)}`}>
                        {section.percentage}%
                      </div>
                    </div>
                    <Icon 
                      name={expandedSection === section.name ? "chevron-up" : "chevron-down"} 
                      size="sm"
                      className="text-gray-400"
                    />
                  </div>
                </button>
                
                {expandedSection === section.name && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3">
                      {/* Progress bar for section */}
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreColor(section.percentage)} transition-all`}
                          style={{ width: `${section.percentage}%` }}
                        />
                      </div>

                      {/* Required fields checklist */}
                      {section.requiredFields && section.requiredFields.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Field Status:</p>
                          <div className="space-y-1">
                            {section.requiredFields.map((field, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                {field.present ? (
                                  <Icon name="check-circle" size="sm" className="text-green-500" />
                                ) : (
                                  <Icon name="x-circle" size="sm" className="text-gray-300" />
                                )}
                                <span className={field.present ? 'text-gray-600' : 'text-gray-400'}>
                                  {field.field.replace(/_/g, ' ')}
                                  {field.required && <span className="text-red-700 ml-1">*</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action button */}
                      <a
                        href={getSectionLink(section.name)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-gray-900 text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Icon name="edit" size="sm" variant="white" />
                        Update {section.name}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>💡 Recommendations to Improve Your Profile</Card.Title>
            <Card.Description>
              Follow these tips to boost your profile score and attract more opportunities
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 pt-0.5">{rec}</span>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ProfileCompletenessWidget;
