import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

/**
 * UC-123: Job Requirements Match Analysis Component
 * Displays:
 * - Skills match score (0-100)
 * - Matching skills, experiences, and qualifications
 * - Missing skills or requirements
 * - Experience level match (entry, mid, senior) against job requirements
 * - User's strongest qualifications for the role
 * - Suggestions on which skills and experiences to emphasize
 * - Recommendations for addressing missing requirements
 */
export default function JobRequirementsMatch({ jobId, userId }) {
  const API = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (jobId && userId) {
      fetchMatchData();
    }
  }, [jobId, userId]);

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/match/${userId}/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMatchData(response.data);
    } catch (err) {
      console.error('Error fetching match data:', err);
      setError(err.response?.data?.message || 'Failed to load match analysis');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreInterpretation = (score) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Good Match';
    if (score >= 60) return 'Moderate Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing job requirements match...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md">
        No match data available
      </div>
    );
  }

  const breakdown = matchData.breakdown || {};
  const score = matchData.overallScore || 0;
  const strengths = matchData.strengths || [];
  const gaps = matchData.gaps || [];
  const recommendations = matchData.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Header with overall score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Requirements Match Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl ${getScoreBadgeColor(score)} shadow-lg`}>
              {Math.round(score)}%
            </div>
            <p className="mt-3 font-semibold text-gray-900">{getScoreInterpretation(score)}</p>
            <p className="text-sm text-gray-600 mt-1">Overall Match Score</p>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700">Skills Match</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(breakdown.skills)}`}>
                {Math.round(breakdown.skills || 0)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700">Experience Level Match</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(breakdown.experience)}`}>
                {Math.round(breakdown.experience || 0)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700">Education Match</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(breakdown.education)}`}>
                {Math.round(breakdown.education || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview', icon: 'chart' },
            { id: 'strengths', label: '✓ Your Strengths', icon: 'check' },
            { id: 'gaps', label: '⚠ Skill Gaps', icon: 'warning' },
            { id: 'recommendations', label: '💡 Recommendations', icon: 'lightbulb' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strongest Qualifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌟 Your Strongest Qualifications</h3>
            {strengths && strengths.length > 0 ? (
              <ul className="space-y-3">
                {strengths.slice(0, 5).map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No key strengths identified</p>
            )}
          </div>

          {/* Top Skill Gaps */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Top Skill Gaps</h3>
            {gaps && gaps.length > 0 ? (
              <ul className="space-y-3">
                {gaps.slice(0, 5).map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <span className="text-red-600 font-bold flex-shrink-0">!</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{gap.skill}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your Level: {gap.have || 0} | Required: {gap.need || 0}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">Great news! No major skill gaps identified.</p>
            )}
          </div>
        </div>
      )}

      {/* Strengths Tab */}
      {activeTab === 'strengths' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Skills and Experiences to Emphasize in Your Application
          </h3>
          {strengths && strengths.length > 0 ? (
            <div className="space-y-3">
              {strengths.map((strength, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500 hover:bg-green-100 transition-colors">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">{strength}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      This qualification matches or exceeds the job requirements
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No matching qualifications identified. Consider addressing the gaps below.</p>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Application Tips</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Highlight these qualifications prominently in your cover letter</li>
              <li>• Use specific examples and metrics that demonstrate these skills</li>
              <li>• Reference relevant projects that showcase these strengths</li>
              <li>• Mirror the job description language when describing these qualifications</li>
            </ul>
          </div>
        </div>
      )}

      {/* Gaps Tab */}
      {activeTab === 'gaps' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Missing Skills or Requirements</h3>
          {gaps && gaps.length > 0 ? (
            <div className="space-y-3">
              {gaps.map((gap, idx) => (
                <div key={idx} className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500 hover:bg-orange-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{gap.skill}</h4>
                    <span className="text-xs font-semibold px-2 py-1 bg-orange-200 text-orange-800 rounded-full">
                      Gap: {gap.need - gap.have} levels
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Current Level: <strong>{gap.have}</strong> | Required Level: <strong>{gap.need}</strong>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min((gap.have / gap.need) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Excellent! No significant skill gaps identified.</p>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">📚 How to Address Gaps</h4>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• Take online courses (Coursera, Udemy, LinkedIn Learning)</li>
              <li>• Work on side projects to build practical experience</li>
              <li>• Seek mentorship or pair programming opportunities</li>
              <li>• Read industry books and documentation</li>
              <li>• Contribute to open-source projects</li>
            </ul>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Recommendations for This Application
          </h3>
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500 hover:bg-blue-100 transition-colors">
                  <p className="text-gray-900">{typeof rec === 'string' ? rec : rec.suggestion || rec}</p>
                  {typeof rec === 'object' && rec.priority && (
                    <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                      Priority: {rec.priority.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No specific recommendations at this time.</p>
          )}

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">✅ Next Steps</h4>
              <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                <li>Focus on addressing high-priority skill gaps first</li>
                <li>Prepare examples of how your strengths apply to this role</li>
                <li>Tailor your resume to emphasize matching qualifications</li>
                <li>In interviews, discuss how you'd approach learning the missing skills</li>
                <li>Show enthusiasm for growth and learning</li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">🚀 Application Strategy</h4>
              <p className="text-sm text-purple-800">
                With a {Math.round(score)}% match score, you have a {
                  score >= 80 ? 'strong' : score >= 60 ? 'reasonable' : 'fair'
                } chance of moving forward. Apply strategic positioning:
              </p>
              <ul className="text-sm text-purple-800 space-y-2 mt-2 list-disc list-inside">
                <li>Lead with your strongest qualifications</li>
                <li>Show willingness to quickly learn missing skills</li>
                <li>Highlight transferable experiences</li>
                <li>Express genuine interest in the role and company</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
