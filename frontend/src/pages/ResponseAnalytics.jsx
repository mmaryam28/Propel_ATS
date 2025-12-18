import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ResponseAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Load gap analysis
      const gapsRes = await axios.get(`${API}/responses/gaps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGapAnalysis(gapsRes.data);

      // Load all responses for stats
      const responsesRes = await axios.get(`${API}/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResponses(responsesRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPrepGuide = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/responses/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Create downloadable text file
      const prepGuide = formatPrepGuide(res.data);
      const blob = new Blob([prepGuide], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interview-prep-guide.md';
      a.click();
    } catch (error) {
      console.error('Error exporting prep guide:', error);
      alert('Failed to export prep guide');
    }
  };

  const formatPrepGuide = (data) => {
    let markdown = `# Interview Preparation Guide\n\n`;
    markdown += `Generated: ${new Date(data.generated_at).toLocaleDateString()}\n`;
    markdown += `Total Responses: ${data.total_responses}\n\n`;
    markdown += `---\n\n`;

    Object.entries(data.responses_by_type).forEach(([type, typeResponses]) => {
      markdown += `## ${type.toUpperCase()} Questions\n\n`;
      
      typeResponses.forEach((response, idx) => {
        markdown += `### ${idx + 1}. ${response.question_text}\n\n`;
        
        if (response.question_category) {
          markdown += `**Category:** ${response.question_category}\n\n`;
        }
        
        markdown += `**Response:**\n\n${response.current_response}\n\n`;
        
        if (response.response_tags && response.response_tags.length > 0) {
          const tags = response.response_tags.map(t => t.tag_value).join(', ');
          markdown += `**Tags:** ${tags}\n\n`;
        }
        
        if (response.success_rate) {
          markdown += `**Success Rate:** ${response.success_rate}%\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    });

    return markdown;
  };

  const getSuccessResponses = () => {
    return responses
      .filter(r => r.success_rate && r.success_rate > 0)
      .sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))
      .slice(0, 5);
  };

  const getMostPracticed = () => {
    return responses
      .filter(r => r.practice_count > 0)
      .sort((a, b) => b.practice_count - a.practice_count)
      .slice(0, 5);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  const successResponses = getSuccessResponses();
  const mostPracticed = getMostPracticed();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/responses')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← Back to Library
          </button>
          <h1 className="text-3xl font-bold text-black">Response Analytics</h1>
          <p className="text-gray-600 mt-1">Insights on your interview preparation</p>
        </div>
        <button
          onClick={exportPrepGuide}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📥 Export Prep Guide
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {gapAnalysis?.total_responses || 0}
          </div>
          <div className="text-sm text-gray-600">Total Responses</div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {responses.filter(r => r.practice_count > 0).length}
          </div>
          <div className="text-sm text-gray-600">Practiced</div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {responses.reduce((sum, r) => sum + (r.practice_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Practice Sessions</div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {responses.filter(r => r.is_favorite).length}
          </div>
          <div className="text-sm text-gray-600">Favorites</div>
        </div>
      </div>

      {/* Coverage by Type */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">Coverage by Question Type</h2>
        <div className="space-y-4">
          {Object.entries(gapAnalysis?.by_type || {}).map(([type, count]) => (
            <div key={type}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium capitalize">{type}</span>
                <span className="text-sm text-gray-600">{count} responses</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    type === 'behavioral' ? 'bg-blue-600' :
                    type === 'technical' ? 'bg-purple-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((count / gapAnalysis.total_responses) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap Analysis */}
      {gapAnalysis && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">📋 Gap Analysis</h2>

          {gapAnalysis.gaps.missing_types.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-black mb-2">Missing Question Types:</h3>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.gaps.missing_types.map((type) => (
                  <span key={type} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {gapAnalysis.gaps.missing_categories.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-black mb-2">Missing Categories:</h3>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.gaps.missing_categories.slice(0, 10).map((category) => (
                  <span key={category} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {category}
                  </span>
                ))}
                {gapAnalysis.gaps.missing_categories.length > 10 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{gapAnalysis.gaps.missing_categories.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {gapAnalysis.gaps.underrepresented_categories.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-black mb-2">Underrepresented Categories (need more responses):</h3>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.gaps.underrepresented_categories.map((category) => (
                  <span key={category} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-semibold text-black mb-2">💡 Suggestions:</h3>
            <ul className="space-y-1">
              {gapAnalysis.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-gray-700">• {suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Top Performing Responses */}
      {successResponses.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🏆 Highest Success Rate</h2>
          <div className="space-y-3">
            {successResponses.map((response) => (
              <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/responses/practice/${response.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium line-clamp-1">{response.question_text}</p>
                  <div className="flex gap-2 mt-1 text-xs text-gray-600">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {response.question_type}
                    </span>
                    {response.question_category && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                        {response.question_category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-green-600">
                    {response.success_rate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {response.total_uses} uses
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Practiced */}
      {mostPracticed.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-black mb-4">🎯 Most Practiced</h2>
          <div className="space-y-3">
            {mostPracticed.map((response) => (
              <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/responses/practice/${response.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium line-clamp-1">{response.question_text}</p>
                  <div className="flex gap-2 mt-1 text-xs text-gray-600">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {response.question_type}
                    </span>
                    {response.question_category && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                        {response.question_category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {response.practice_count}
                  </div>
                  <div className="text-xs text-gray-500">
                    sessions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {responses.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg mb-4">No responses in your library yet</p>
          <button
            onClick={() => navigate('/responses')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Your First Response
          </button>
        </div>
      )}
    </div>
  );
}
