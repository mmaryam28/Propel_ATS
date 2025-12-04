import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TeamDashboard() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [resources, setResources] = useState({ applications: [], resumes: [], coverLetters: [] });
  const [showJobModal, setShowJobModal] = useState(false);
  const [showLinkJobModal, setShowLinkJobModal] = useState(false);
  const [myJobs, setMyJobs] = useState([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentResource, setCurrentResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [myResumes, setMyResumes] = useState([]);
  const [myCoverLetters, setMyCoverLetters] = useState([]);
  const [message, setMessage] = useState(null);
  
  const [jobForm, setJobForm] = useState({
    company: '',
    position: '',
    location: '',
    jobDescription: '',
    salary: '',
    status: 'saved',
    notes: ''
  });
  
  const [coverLetterForm, setCoverLetterForm] = useState({
    company: '',
    position: '',
    content: '',
    status: 'draft'
  });

  useEffect(() => {
    // Get current user ID from localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCurrentUserId(userId);
      console.log('Current user ID set to:', userId);
    }
  }, []);

  useEffect(() => {
    if (teamId) {
      fetchData();
      fetchResources();
      fetchTasks();
      fetchMembers();
      fetchMyResumes();
      fetchMyCoverLetters();
    }
  }, [teamId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [teamRes, analyticsRes, activityRes] = await Promise.all([
        axios.get(`${API}/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/teams/${teamId}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/teams/${teamId}/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTeam(teamRes.data);
      setAnalytics(analyticsRes.data);
      setActivity(activityRes.data || []);
    } catch (err) {
      console.error('Error fetching team data:', err);
      if (err.response?.status === 403) {
        alert('You do not have permission to view analytics');
        navigate('/teams');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(response.data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJobs(response.data);
    } catch (err) {
      console.error('Error fetching my jobs:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLinkJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/${teamId}/link-job/${jobId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Job linked to team successfully!');
      setShowLinkJobModal(false);
      fetchResources();
    } catch (err) {
      console.error('Error linking job:', err);
      alert(err.response?.data?.message || 'Failed to link job');
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/${teamId}/job-postings`, jobForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Job posting added successfully!');
      setShowJobModal(false);
      setJobForm({ company: '', position: '', location: '', jobDescription: '', salary: '', status: 'saved', notes: '' });
      fetchResources();
      fetchData(); // Refresh analytics
    } catch (err) {
      console.error('Error adding job:', err);
      showMessage('Failed to add job posting', 'error');
    }
  };

  const handleAddCoverLetter = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/${teamId}/cover-letters`, coverLetterForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Cover letter added successfully!');
      setShowCoverLetterModal(false);
      setCoverLetterForm({ company: '', position: '', content: '', status: 'draft' });
      fetchResources();
    } catch (err) {
      console.error('Error adding cover letter:', err);
      showMessage('Failed to add cover letter', 'error');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const taskData = {
        title: e.target.title.value,
        description: e.target.description.value,
        assigned_to: e.target.assigned_to.value || null,
        due_date: e.target.due_date.value || null,
        priority: e.target.priority.value,
        status: e.target.status.value
      };
      
      if (currentTask) {
        await axios.put(`${API}/teams/${teamId}/tasks/${currentTask.id}`, taskData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('Task updated successfully!');
      } else {
        await axios.post(`${API}/teams/${teamId}/tasks`, taskData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('Task created successfully!');
      }
      
      setShowTaskModal(false);
      setCurrentTask(null);
      fetchTasks();
      fetchData();
    } catch (err) {
      console.error('Error saving task:', err);
      showMessage(err.response?.data?.message || 'Failed to save task', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/teams/${teamId}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Task deleted successfully!');
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      showMessage(err.response?.data?.message || 'Failed to delete task', 'error');
    }
  };

  const handleOpenComments = async (resourceType, resourceId, resourceTitle) => {
    setCurrentResource({ type: resourceType, id: resourceId, title: resourceTitle });
    setShowCommentsModal(true);
    setNewComment('');
    await fetchComments(resourceType, resourceId);
  };

  const fetchComments = async (resourceType, resourceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teams/${teamId}/comments/${resourceType}/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/${teamId}/comments`, {
        resource_type: currentResource.type,
        resource_id: currentResource.id,
        comment: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewComment('');
      await fetchComments(currentResource.type, currentResource.id);
      showMessage('Comment added!');
    } catch (err) {
      console.error('Error adding comment:', err);
      showMessage('Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/teams/${teamId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchComments(currentResource.type, currentResource.id);
      showMessage('Comment deleted!');
    } catch (err) {
      console.error('Error deleting comment:', err);
      showMessage('Failed to delete comment', 'error');
    }
  };

  const fetchMyResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyResumes(response.data);
    } catch (err) {
      console.error('Error fetching my resumes:', err);
    }
  };

  const fetchMyCoverLetters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/coverletters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyCoverLetters(response.data);
    } catch (err) {
      console.error('Error fetching my cover letters:', err);
    }
  };

  const handleShareResume = async (resumeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/${teamId}/share-resume/${resumeId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Resume shared with team!');
      fetchResources();
      fetchMyResumes();
    } catch (err) {
      console.error('Error sharing resume:', err);
      showMessage(err.response?.data?.message || 'Failed to share resume', 'error');
    }
  };

  const handleShareCoverLetter = async (letterId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teams/${teamId}/share-cover-letter/${letterId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Cover letter shared with team!');
      fetchResources();
      fetchMyCoverLetters();
    } catch (err) {
      console.error('Error sharing cover letter:', err);
      showMessage(err.response?.data?.message || 'Failed to share cover letter', 'error');
    }
  };

  const formatActivityType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatActivityData = (activityType, data) => {
    if (!data) return null;
    
    try {
      switch (activityType) {
        case 'invitation_sent':
          return `Invited ${data.email} as ${data.role}`;
        case 'member_joined':
          return `${data.email || 'A member'} joined the team`;
        case 'member_removed':
          return `${data.email || 'A member'} was removed from the team`;
        case 'role_changed':
          return `${data.email || 'Member'} role changed to ${data.new_role}`;
        case 'job_posting_added':
          return `Added job: ${data.position} at ${data.company}`;
        case 'cover_letter_added':
          return `Added cover letter for ${data.position} at ${data.company}`;
        case 'resume_added':
          return `Added resume: ${data.title}`;
        default:
          // For unknown types, show key-value pairs
          return Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
      }
    } catch (e) {
      return JSON.stringify(data);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {message && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => navigate('/teams')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Teams
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">{team?.name} - Dashboard</h1>
            <p className="text-gray-600">Team performance and activity overview</p>
          </div>
          <button
            onClick={() => navigate(`/teams/${teamId}/members`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Manage Members
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'jobs', 'resumes', 'coverLetters', 'tasks'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'jobs' && `Job Postings (${resources.applications.length})`}
              {tab === 'resumes' && `Resumes (${resources.resumes.length})`}
              {tab === 'coverLetters' && `Cover Letters (${resources.coverLetters.length})`}
              {tab === 'tasks' && `Tasks (${tasks.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Analytics Cards */}
          {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Candidates</div>
            <div className="text-3xl font-bold text-blue-600">{analytics.total_candidates}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Applications</div>
            <div className="text-3xl font-bold text-green-600">{analytics.total_applications}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Interviews</div>
            <div className="text-3xl font-bold text-purple-600">{analytics.total_interviews}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Avg Applications/Candidate</div>
            <div className="text-3xl font-bold text-orange-600">
              {analytics.average_applications_per_candidate.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Applications by Status */}
      {analytics?.applications_by_status && Object.keys(analytics.applications_by_status).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Applications by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.applications_by_status).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {status.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {activity.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{formatActivityType(item.activity_type)}</div>
                    {item.activity_data && (
                      <div className="text-sm text-gray-600 mt-1">
                        {formatActivityData(item.activity_type, item.activity_data)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
        </>
      )}

      {/* Job Postings Tab */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Team Job Postings</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchMyJobs();
                  setShowLinkJobModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Link from Job Tracker
              </button>
              <button
                onClick={() => setShowJobModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add New Job
              </button>
            </div>
          </div>
          <div className="divide-y">
            {resources.applications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No job postings yet. Add your first job posting to get started!
              </div>
            ) : (
              resources.applications.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{app.title || app.position}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          app.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                          app.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                          app.status === 'offer' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{app.company}</p>
                      <p className="text-sm text-gray-500">{app.location}</p>
                      {app.salaryMin && <p className="text-sm text-gray-500 mt-1">Salary: ${app.salaryMin.toLocaleString()}{app.salaryMax ? ` - $${app.salaryMax.toLocaleString()}` : '+'}</p>}
                      {app.notes && <p className="text-sm text-gray-600 mt-2">{app.notes}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        Added by: {app.user?.firstname} {app.user?.lastname} ({app.user?.email})
                      </p>
                      <button
                        onClick={() => handleOpenComments('job', app.id, `${app.title || app.position} at ${app.company}`)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        💬 Comments
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(app.createdAt || app.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resumes Tab */}
      {activeTab === 'resumes' && (
        <div className="space-y-6">
          {/* Shared Resumes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Shared Team Resumes</h2>
            </div>
            <div className="divide-y">
              {resources.resumes.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No resumes shared yet
                </div>
              ) : (
                resources.resumes.map((resume) => (
                  <div key={resume.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{resume.title || 'Untitled Resume'}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {resume.filePath && (
                            <a href={`${API}${resume.filePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Resume
                            </a>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Shared by: {resume.user?.firstname} {resume.user?.lastname}
                        </p>
                        <button
                          onClick={() => handleOpenComments('resume', resume.id, resume.title || 'Untitled Resume')}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          💬 Comments
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Resumes - Ready to Share */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">My Resumes</h2>
                <p className="text-sm text-gray-600">Share your resumes with the team</p>
              </div>
              <button
                onClick={() => window.location.href = '/resumes'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Manage Resumes
              </button>
            </div>
            <div className="divide-y">
              {myResumes.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p>No resumes found.</p>
                  <button
                    onClick={() => window.location.href = '/resumes'}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Upload your first resume
                  </button>
                </div>
              ) : (
                myResumes.map((resume) => {
                  const isShared = resources.resumes.some(r => r.id === resume.id);
                  return (
                    <div key={resume.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{resume.title || 'Untitled Resume'}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(resume.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {isShared ? (
                          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                            ✓ Shared
                          </span>
                        ) : (
                          <button
                            onClick={() => handleShareResume(resume.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Share with Team
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Letters Tab */}
      {activeTab === 'coverLetters' && (
        <div className="space-y-6">
          {/* Shared Cover Letters */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Shared Team Cover Letters</h2>
            </div>
            <div className="divide-y">
              {resources.coverLetters.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No cover letters shared with team yet.
                </div>
              ) : (
                resources.coverLetters.map((letter) => (
                  <div key={letter.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{letter.position} at {letter.company}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${
                            letter.status === 'final' ? 'bg-green-100 text-green-800' :
                            letter.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {letter.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{letter.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Created by: {letter.user?.firstname} {letter.user?.lastname} ({letter.user?.email})
                        </p>
                        <button
                          onClick={() => handleOpenComments('cover_letter', letter.id, `${letter.position} at ${letter.company}`)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          💬 Comments
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(letter.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Cover Letters */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">My Cover Letters</h2>
            </div>
            <div className="divide-y">
              {myCoverLetters.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  You haven't created any cover letters yet.
                </div>
              ) : (
                myCoverLetters.map((letter) => {
                  const isShared = resources.coverLetters.some(cl => cl.id === letter.id);
                  return (
                    <div key={letter.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{letter.position} at {letter.company}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                              letter.status === 'final' ? 'bg-green-100 text-green-800' :
                              letter.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {letter.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-3">{letter.content}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-gray-500">
                            {new Date(letter.created_at).toLocaleDateString()}
                          </div>
                          {isShared ? (
                            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                              ✓ Shared
                            </span>
                          ) : (
                            <button
                              onClick={() => handleShareCoverLetter(letter.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Share with Team
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Team Tasks</h2>
            <button
              onClick={() => {
                setCurrentTask(null);
                setShowTaskModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Create Task
            </button>
          </div>
          <div className="divide-y">
            {tasks.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No tasks yet. Create your first task to get started!
              </div>
            ) : (
              <div className="p-4">
                {['todo', 'in_progress', 'completed'].map(status => {
                  const statusTasks = tasks.filter(t => t.status === status);
                  if (statusTasks.length === 0) return null;
                  
                  return (
                    <div key={status} className="mb-6">
                      <h3 className="font-semibold text-lg mb-3 capitalize">
                        {status.replace('_', ' ')} ({statusTasks.length})
                      </h3>
                      <div className="space-y-3">
                        {statusTasks.map((task) => (
                          <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold text-black">{task.title}</h4>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {task.priority}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                  </span>
                                </div>
                                {task.description && <p className="text-sm text-black mt-2">{task.description}</p>}
                                <div className="flex items-center gap-4 mt-2 text-xs text-black">
                                  {task.assigned_to_user && (
                                    <span>Assigned to: {task.assigned_to_user.firstname} {task.assigned_to_user.lastname}</span>
                                  )}
                                  {task.due_date && (
                                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                  )}
                                  <span>By: {task.created_by_user?.firstname} {task.created_by_user?.lastname}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {(() => {
                                  console.log('Task:', task.title, 'created_by:', task.created_by, 'currentUserId:', currentUserId, 'match:', String(task.created_by) === String(currentUserId));
                                  return String(task.created_by) === String(currentUserId);
                                })() && (
                                  <button
                                    onClick={() => {
                                      setCurrentTask(task);
                                      setShowTaskModal(true);
                                    }}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add Job Posting</h2>
            <form onSubmit={handleAddJob}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company *</label>
                  <input
                    type="text"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position *</label>
                  <input
                    type="text"
                    value={jobForm.position}
                    onChange={(e) => setJobForm({ ...jobForm, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Job Description</label>
                  <textarea
                    value={jobForm.jobDescription}
                    onChange={(e) => setJobForm({ ...jobForm, jobDescription: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salary</label>
                  <input
                    type="text"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={jobForm.status}
                    onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={jobForm.notes}
                    onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Job Modal */}
      {showLinkJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Link Jobs from Your Job Tracker</h2>
            {myJobs.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <p>No jobs available to link.</p>
                <p className="text-sm mt-2">Jobs you add to your Job Tracker that aren't already in this team will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{job.title || job.position}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          job.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                          job.status === 'offer' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{job.company}</p>
                      <p className="text-sm text-gray-500">{job.location}</p>
                      {job.salaryMin && <p className="text-sm text-gray-500 mt-1">${job.salaryMin.toLocaleString()}{job.salaryMax ? ` - $${job.salaryMax.toLocaleString()}` : '+'}</p>}
                    </div>
                    <button
                      onClick={() => handleLinkJob(job.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Link to Team
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => setShowLinkJobModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Cover Letter Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add Cover Letter</h2>
            <form onSubmit={handleAddCoverLetter}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company *</label>
                  <input
                    type="text"
                    value={coverLetterForm.company}
                    onChange={(e) => setCoverLetterForm({ ...coverLetterForm, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position *</label>
                  <input
                    type="text"
                    value={coverLetterForm.position}
                    onChange={(e) => setCoverLetterForm({ ...coverLetterForm, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Content *</label>
                  <textarea
                    value={coverLetterForm.content}
                    onChange={(e) => setCoverLetterForm({ ...coverLetterForm, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={coverLetterForm.status}
                    onChange={(e) => setCoverLetterForm({ ...coverLetterForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCoverLetterModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Cover Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{currentTask ? 'Edit Task' : 'Create Task'}</h2>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={currentTask?.title}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={currentTask?.description}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    name="assigned_to"
                    defaultValue={currentTask?.assigned_to || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.users?.firstname || member.firstname} {member.users?.lastname || member.lastname} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      name="priority"
                      defaultValue={currentTask?.priority || 'medium'}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="status"
                      defaultValue={currentTask?.status || 'todo'}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={currentTask?.due_date ? new Date(currentTask.due_date).toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setCurrentTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {currentTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && currentResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Comments</h2>
                <p className="text-sm text-gray-600">{currentResource.title}</p>
              </div>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {comment.user?.firstname} {comment.user?.lastname}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1">{comment.comment}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
                required
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowCommentsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
