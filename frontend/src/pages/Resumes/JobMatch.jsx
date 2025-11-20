import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

const JobMatch = () => {
  const API = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [weights, setWeights] = useState({
    skills_weight: 0.7,
    experience_weight: 0.2,
    education_weight: 0.1
  });
  const [matchHistory, setMatchHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      console.log('Using stored userId:', storedUserId);
      setUserId(storedUserId);
      setError(null);
      return;
    }

    const token = localStorage.getItem('token');
    console.log('Token found:', !!token, token ? token.substring(0, 50) + '...' : 'none');
    
    if (!token) {
      setError('Please log in to view job matches');
      return;
    }

    axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((response) => {
      console.log('Auth response:', response.data);
      if (response.data?.user?.id) {
        setUserId(response.data.user.id);
        localStorage.setItem('userId', response.data.user.id);
        setError(null); 
      } else {
        setError('User ID not found in response');
      }
    }).catch((err) => {
      console.error('Auth error details:', err.response?.status, err.response?.data);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to authenticate user');
      }
    });
  }, []);

  useEffect(() => {
    if (userId) {
      fetchJobs();
      fetchUserSkills();
      fetchWeights();
      fetchMatchHistory();
    }
  }, [userId]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs from server.');
    }
  };

  const fetchUserSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/match/user-skills/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserSkills(response.data || []);
    } catch (err) {
      console.error('Error fetching user skills:', err);
    }
  };

  const fetchWeights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/match/weights/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setWeights(response.data);
      }
    } catch (err) {
      console.error('Error fetching weights:', err);
    }
  };

  const fetchMatchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/match/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatchHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching match history:', err);
    }
  };

  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/match/${userId}/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatchData(response.data);
      
      // Save to history
      await axios.post(`${API}/match/history`, {
        userId,
        jobId: job.id,
        matchScore: response.data.overallScore
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchMatchHistory(); 
    } catch (err) {
      console.error('Error computing match:', err);
      setError('Failed to compute job match');
    } finally {
      setLoading(false);
    }
  };

  const updateWeights = async (newWeights) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/match/weights/${userId}`, newWeights, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeights(newWeights);
      
      if (selectedJob) {
        handleJobSelect(selectedJob);
      }
    } catch (err) {
      console.error('Error updating weights:', err);
      setError('Failed to update weights');
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

  const exportMatchReport = () => {
    if (!matchData || !selectedJob) return;
    
    const report = {
      job: selectedJob.title,
      company: selectedJob.company,
      matchDate: new Date().toISOString(),
      overallScore: matchData.overallScore,
      breakdown: matchData.breakdown,
      strengths: matchData.strengths,
      gaps: matchData.gaps,
      recommendations: matchData.recommendations
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-match-report-${selectedJob.title.replace(/\\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Match Overview', icon: 'home' },
    { id: 'breakdown', label: 'Score Breakdown', icon: 'chart' },
    { id: 'analysis', label: 'Gap Analysis', icon: 'search' },
    { id: 'recommendations', label: 'Improvements', icon: 'lightbulb' },
    { id: 'history', label: 'Match History', icon: 'clock' },
    { id: 'settings', label: 'Matching Criteria', icon: 'settings' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Matching Algorithm</h1>
        <p className="text-gray-600">Discover how well you match specific job opportunities</p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Icon name="job" size="sm" />
            Select a Job to Analyze
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.slice(0, 12).map((job) => (
              <div
                key={job.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedJob?.id === job.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleJobSelect(job)}
              >
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.company}</p>
                <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                {job.salary_max && (
                  <p className="text-sm text-green-600 mt-1">
                    ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Computing match score...</span>
        </div>
      )}

      {matchData && selectedJob && !loading && (
        <div className="space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon name={tab.icon} size="sm" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <Card.Header>
                    <Card.Title>Overall Match Score</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold text-white ${getScoreBadgeColor(matchData.overallScore)}`}>
                        {Math.round(matchData.overallScore)}%
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">{selectedJob.title}</h3>
                      <p className="text-gray-600">{selectedJob.company}</p>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Skills Match</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(matchData.breakdown.skills)}`}>
                          {Math.round(matchData.breakdown.skills)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Experience Match</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(matchData.breakdown.experience)}`}>
                          {Math.round(matchData.breakdown.experience)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Education Match</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(matchData.breakdown.education)}`}>
                          {Math.round(matchData.breakdown.education)}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={exportMatchReport}
                      className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Icon name="download" size="sm" />
                      Export Match Report
                    </button>
                  </Card.Body>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <Card.Header>
                    <Card.Title>Key Strengths</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {matchData.strengths?.length > 0 ? (
                      <div className="space-y-2">
                        {matchData.strengths.slice(0, 5).map((strength, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{strength}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No strengths identified</p>
                    )}
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Header>
                    <Card.Title>Top Skill Gaps</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {matchData.gaps?.length > 0 ? (
                      <div className="space-y-2">
                        {matchData.gaps.slice(0, 5).map((gap, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{gap.skill}</span>
                            <span className="text-xs text-red-600">{gap.have}/{gap.need}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No gaps identified</p>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'breakdown' && (
            <Card>
              <Card.Header>
                <Card.Title>Detailed Score Breakdown</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900">Skills</h3>
                      <div className="text-3xl font-bold text-blue-600 mt-2">
                        {Math.round(matchData.breakdown.skills)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Weight: {(weights.skills_weight * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900">Experience</h3>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {Math.round(matchData.breakdown.experience)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Weight: {(weights.experience_weight * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900">Education</h3>
                      <div className="text-3xl font-bold text-purple-600 mt-2">
                        {Math.round(matchData.breakdown.education)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Weight: {(weights.education_weight * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {matchData.skillBreakdown && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Individual Skill Scores</h4>
                      <div className="space-y-3">
                        {Object.entries(matchData.skillBreakdown).map(([skill, data]) => (
                          <div key={skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{skill}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">
                                Have: {data.have} | Need: {data.need}
                              </span>
                              <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(data.score)}`}>
                                {data.score}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <Card.Title>Strengths Analysis</Card.Title>
                </Card.Header>
                <Card.Body>
                  {matchData.strengths?.length > 0 ? (
                    <div className="space-y-4">
                      {matchData.strengths.map((strength, index) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                          <h4 className="font-medium text-green-800">{strength}</h4>
                          <p className="text-sm text-green-700 mt-1">
                            You meet or exceed the requirements for this skill
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No strengths identified for this position.</p>
                  )}
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Gap Analysis</Card.Title>
                </Card.Header>
                <Card.Body>
                  {matchData.gaps?.length > 0 ? (
                    <div className="space-y-4">
                      {matchData.gaps.map((gap, index) => (
                        <div key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-red-800">{gap.skill}</h4>
                            <span className="text-sm text-red-600">
                              Gap: {gap.need - gap.have} levels
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-red-700">Current: {gap.have}</span>
                            <span className="text-red-700">Required: {gap.need}</span>
                            <span className="text-red-700">Weight: {gap.weight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No skill gaps identified!</p>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <Card>
              <Card.Header>
                <Card.Title>Profile Improvement Recommendations</Card.Title>
              </Card.Header>
              <Card.Body>
                {matchData.recommendations?.length > 0 ? (
                  <div className="space-y-4">
                    {matchData.recommendations.map((rec, index) => (
                      <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-medium text-yellow-800">{rec.skill || `Recommendation ${index + 1}`}</h4>
                        <p className="text-yellow-700 mt-1">{rec.suggestion || rec}</p>
                        {rec.priority && (
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rec.priority} priority
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="check" size="lg" className="text-green-500 mb-4" />
                    <p className="text-gray-600">Great! No specific improvements needed for this role.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card>
              <Card.Header>
                <Card.Title>Match Score History</Card.Title>
              </Card.Header>
              <Card.Body>
                {matchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {matchHistory.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{entry.job_title}</h4>
                          <p className="text-sm text-gray-600">{entry.company}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded font-medium ${getScoreColor(entry.match_score)}`}>
                          {Math.round(entry.match_score)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No match history available</p>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card>
              <Card.Header>
                <Card.Title>Personalized Matching Criteria</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <p className="text-gray-600">
                    Adjust how different factors are weighted in your job match calculations:
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skills Weight ({(weights.skills_weight * 100).toFixed(0)}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={weights.skills_weight}
                        onChange={(e) => setWeights(prev => ({ ...prev, skills_weight: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Weight ({(weights.experience_weight * 100).toFixed(0)}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={weights.experience_weight}
                        onChange={(e) => setWeights(prev => ({ ...prev, experience_weight: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Weight ({(weights.education_weight * 100).toFixed(0)}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={weights.education_weight}
                        onChange={(e) => setWeights(prev => ({ ...prev, education_weight: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateWeights(weights)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setWeights({ skills_weight: 0.7, experience_weight: 0.2, education_weight: 0.1 })}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {!selectedJob && !loading && (
        <div className="text-center py-12">
          <Icon name="search" size="xl" className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Job to Get Started</h3>
          <p className="text-gray-600">Choose any job from the list above to see how well you match</p>
        </div>
      )}
    </div>
  );
};

export default JobMatch;