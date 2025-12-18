import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function QualityCheck() {
  const [userId, setUserId] = useState('');
  const [jobId, setJobId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState('');
  
  const [resume, setResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  const [useExistingResume, setUseExistingResume] = useState(true);
  const [useExistingCoverLetter, setUseExistingCoverLetter] = useState(true);
  const [useLinkedInUrl, setUseLinkedInUrl] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [fetchingLinkedIn, setFetchingLinkedIn] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.sub || payload.userId);
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchJobs();
      fetchResumes();
      fetchCoverLetters();
      fetchHistory();
      fetchStatistics();
    }
  }, [userId]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + '/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/resume?userId=${userId}`, {
        withCredentials: true
      });
      const resumeData = Array.isArray(response.data) ? response.data : (response.data && response.data.resumes) || [];
      setResumes(resumeData);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    }
  };

  const fetchCoverLetters = async () => {
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/coverletters?userId=${userId}`, {
        withCredentials: true
      });
      const clData = Array.isArray(response.data) ? response.data : response.data?.coverLetters || [];
      setCoverLetters(clData);
    } catch (err) {
      console.error('Error fetching cover letters:', err);
    }
  };

  const fetchHistory = async () => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/application-quality/history/${userId}`, {
        params: jobId ? { jobId } : {},
      });
      setHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!userId) return;
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/application-quality/statistics/${userId}`);
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    const job = jobs.find(j => j.id === jobId);
    if (job && job.description) {
      setJobDescription(job.description);
    }
  };

  const handleResumeSelect = async (resumeId) => {
    setSelectedResumeId(resumeId);
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/resume/${resumeId}`, {
        withCredentials: true
      });
      const resumeData = response.data;
      // Construct resume text from sections
      let resumeText = '';
      if (resumeData.sections) {
        const sections = JSON.parse(resumeData.sections);
        // Format sections into readable text
        Object.entries(sections).forEach(([key, value]) => {
          resumeText += `${key.toUpperCase()}\n${JSON.stringify(value, null, 2)}\n\n`;
        });
      }
      setResume(resumeText || JSON.stringify(resumeData, null, 2));
    } catch (err) {
      console.error('Error fetching resume:', err);
      setError('Failed to load resume content');
    }
  };

  const handleCoverLetterSelect = async (coverLetterId) => {
    setSelectedCoverLetterId(coverLetterId);
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/coverletters/${coverLetterId}`);
      setCoverLetter(response.data.content || '');
    } catch (err) {
      console.error('Error fetching cover letter:', err);
      setError('Failed to load cover letter content');
    }
  };

  const fetchLinkedInProfile = async () => {
    if (!linkedInUrl) return;
    setFetchingLinkedIn(true);
    try {
      // Mock LinkedIn scraping - in production, use a proper API or scraping service
      setLinkedIn('LinkedIn profile content would be fetched here from: ' + linkedInUrl);
      // TODO: Implement actual LinkedIn API integration
    } catch (err) {
      console.error('Error fetching LinkedIn:', err);
      setError('Failed to fetch LinkedIn profile. Please paste content manually.');
    } finally {
      setFetchingLinkedIn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + '/application-quality/score', {
        userId,
        jobId: selectedJobId || undefined,
        resume,
        coverLetter,
        linkedIn,
        jobDescription,
      });
      
      setResult(response.data);
      fetchHistory();
      fetchStatistics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate quality score');
      console.error('Error calculating score:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const chartData = history.slice(0, 10).reverse().map((item, index) => ({
    name: `#${history.length - index}`,
    score: item.score,
    date: new Date(item.created_at).toLocaleDateString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Application Package Quality Check
          </h1>
          <p className="text-lg text-gray-600">
            Get AI-powered quality scoring before you submit your application
          </p>
        </div>

        {/* Statistics Overview */}
        {statistics && statistics.total_scores > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <Card.Body>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className={`text-3xl font-bold ${getScoreColor(statistics.average_score)}`}>
                  {statistics.average_score}
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-sm text-gray-600">Highest Score</div>
                <div className="text-3xl font-bold text-green-600">
                  {statistics.highest_score}
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-sm text-gray-600">Total Checks</div>
                <div className="text-3xl font-bold text-blue-600">
                  {statistics.total_scores}
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-sm text-gray-600">Ready to Submit</div>
                <div className="text-3xl font-bold text-purple-600">
                  {statistics.submittable_percentage}%
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Main Form */}
        <Card className="mb-8">
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-xl">
              <Icon name="document" size="sm" />
              Application Materials
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Job (Optional)
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a job or enter manually below --</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resume Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Resume <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseExistingResume(!useExistingResume)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {useExistingResume ? 'Paste new content' : 'Use existing resume'}
                  </button>
                </div>
                
                {useExistingResume ? (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => handleResumeSelect(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select a resume --</option>
                    {resumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title || 'Untitled Resume'} (Updated: {new Date(resume.updatedAt || resume.createdat).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    required
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste your resume content here..."
                  />
                )}
              </div>

              {/* Cover Letter Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cover Letter <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseExistingCoverLetter(!useExistingCoverLetter)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {useExistingCoverLetter ? 'Paste new content' : 'Use existing cover letter'}
                  </button>
                </div>
                
                {useExistingCoverLetter ? (
                  <select
                    value={selectedCoverLetterId}
                    onChange={(e) => handleCoverLetterSelect(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select a cover letter --</option>
                    {coverLetters.map(cl => (
                      <option key={cl.id} value={cl.id}>
                        {cl.title || `${cl.company} - ${cl.position}`} (Updated: {new Date(cl.updatedAt || cl.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    required
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste your cover letter content here..."
                  />
                )}
              </div>

              {/* LinkedIn Profile */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    LinkedIn Profile <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseLinkedInUrl(!useLinkedInUrl)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {useLinkedInUrl ? 'Paste content manually' : 'Use LinkedIn URL'}
                  </button>
                </div>
                
                {useLinkedInUrl ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="url"
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                    <button
                    type="button"
                    onClick={fetchLinkedInProfile}
                    disabled={fetchingLinkedIn || !linkedInUrl}
                    className="w-24 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-xs"
                    >
                    Fetch
                    </button>

                  </div>
                ) : (
                  <textarea
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    required
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm mt-2"
                    placeholder="Paste your LinkedIn profile summary..."
                  />
                )}
              </div>

              {/* Job Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                  rows={8}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Paste the job description here (auto-filled if you selected a job above)..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing Application Package...
                  </span>
                ) : (
                  '🎯 Calculate Quality Score'
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 mb-8">
            {/* Overall Score */}
            <Card className={`${getScoreBgColor(result.score)} border-2`}>
              <Card.Body>
                <div className="text-center py-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Quality Score
                  </div>
                  <div className={`text-7xl font-bold ${getScoreColor(result.score)} mb-4`}>
                    {result.score}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    {result.canSubmit ? (
                      <>
                        <Icon name="check" className="text-green-600 w-6 h-6" />
                        <span className="text-green-700 font-semibold text-lg">
                          ✅ Ready to Submit
                        </span>
                      </>
                    ) : (
                      <>
                        <Icon name="x" className="text-red-600 w-6 h-6" />
                        <span className="text-red-700 font-semibold text-lg">
                          ⚠️ Needs Improvement (Minimum 70)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Score Breakdown */}
            <Card>
              <Card.Header>
                <Card.Title>Score Breakdown</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Alignment with Job (50%)</span>
                      <span className={`font-semibold ${getScoreColor(result.breakdown.alignment)}`}>
                        {result.breakdown.alignment}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          result.breakdown.alignment >= 80
                            ? 'bg-green-600'
                            : result.breakdown.alignment >= 70
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${result.breakdown.alignment}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Formatting & Polish (30%)</span>
                      <span className={`font-semibold ${getScoreColor(result.breakdown.formatting)}`}>
                        {result.breakdown.formatting}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          result.breakdown.formatting >= 80
                            ? 'bg-green-600'
                            : result.breakdown.formatting >= 70
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${result.breakdown.formatting}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Consistency Across Materials (20%)</span>
                      <span className={`font-semibold ${getScoreColor(result.breakdown.consistency)}`}>
                        {result.breakdown.consistency}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          result.breakdown.consistency >= 80
                            ? 'bg-green-600'
                            : result.breakdown.consistency >= 70
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${result.breakdown.consistency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Icon name="lightBulb" size="sm" />
                    Improvement Suggestions (Priority Ranked)
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <ul className="space-y-3">
                    {result.suggestions.map((suggestion, index) => {
                      const isHigh = suggestion.includes('[HIGH]');
                      const isMedium = suggestion.includes('[MEDIUM]');
                      return (
                        <li
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            isHigh
                              ? 'bg-red-50 border-l-4 border-red-500'
                              : isMedium
                              ? 'bg-yellow-50 border-l-4 border-yellow-500'
                              : 'bg-blue-50 border-l-4 border-blue-500'
                          }`}
                        >
                          <span className={`font-bold text-xs ${
                            isHigh ? 'text-red-700' : isMedium ? 'text-yellow-700' : 'text-blue-700'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-sm flex-1">{suggestion}</span>
                        </li>
                      );
                    })}
                  </ul>
                </Card.Body>
              </Card>
            )}

            {/* Missing Keywords */}
            {result.missingKeywords && result.missingKeywords.length > 0 && (
              <Card>
                <Card.Header>
                  <Card.Title>Missing Keywords from Job Description</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}

        {/* Score History Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <Card.Header>
              <Card.Title>Score History (Last 10 Checks)</Card.Title>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
}
