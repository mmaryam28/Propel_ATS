import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function ResponseLibrary() {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const [responses, setResponses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [message, setMessage] = useState(null);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [suggestedResponses, setSuggestedResponses] = useState([]);

  // Filters
  const [questionTypeFilter, setQuestionTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [favoriteFilter, setFavoriteFilter] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'behavioral',
    question_category: '',
    current_response: '',
    is_favorite: false,
    tags: [],
    notes: '',
  });

  // Tag input
  const [tagInput, setTagInput] = useState({ tag_type: 'skill', tag_value: '' });

  useEffect(() => {
    loadResponses();
    loadJobs();
  }, [questionTypeFilter, categoryFilter, favoriteFilter]);

  // Scroll modal to top when it opens
  useEffect(() => {
    if (showModal && modalRef.current) {
      modalRef.current.scrollTop = 0;
      // Also scroll the window/body to top
      window.scrollTo(0, 0);
    }
  }, [showModal]);

  const loadJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data.filter(job => job.status === 'applied' || job.status === 'interviewing'));
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadResponses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API}/responses?`;
      if (questionTypeFilter) url += `question_type=${questionTypeFilter}&`;
      if (categoryFilter) url += `question_category=${categoryFilter}&`;
      if (favoriteFilter) url += `is_favorite=true&`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResponses(response.data);
    } catch (error) {
      console.error('Error loading responses:', error);
      showMessage('Failed to load responses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form Data on Submit:', formData);
    console.log('Question Text:', formData.question_text);
    console.log('Current Response:', formData.current_response);
    
    if (!formData.question_text || !formData.current_response) {
      alert(`VALIDATION ERROR:\n\nQuestion Text: "${formData.question_text || 'EMPTY'}"\nResponse: "${formData.current_response || 'EMPTY'}"\n\nPlease fill in BOTH the Interview Question field (at the top) and Your Response field!`);
      showMessage('Question and response are required', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'EXISTS' : 'MISSING');
      
      // Create payload explicitly
      const payload = {
        question_text: formData.question_text,
        question_type: formData.question_type,
        question_category: formData.question_category || undefined,
        current_response: formData.current_response,
        is_favorite: formData.is_favorite || false,
        tags: formData.tags || [],
        notes: formData.notes || '',
      };
      
      console.log('Payload being sent:', JSON.stringify(payload, null, 2));
      
      if (editingResponse) {
        const response = await axios.put(`${API}/responses/${editingResponse.id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Update API Response:', response.data);
        showMessage('Response updated successfully!');
      } else {
        const response = await axios.post(`${API}/responses`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Create API Response:', response.data);
        showMessage('Response created successfully!');
      }
      
      // Close modal and reset form
      setShowModal(false);
      setEditingResponse(null);
      resetForm();
      
      // Reload responses to get updated list
      await loadResponses();
    } catch (error) {
      console.error('Error saving response:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save response';
      showMessage(errorMessage, 'error');
      alert(`Error: ${errorMessage}\n\nCheck console for details.`);
    }
  };

  const handleEdit = (response) => {
    setEditingResponse(response);
    setFormData({
      question_text: response.question_text,
      question_type: response.question_type,
      question_category: response.question_category || '',
      current_response: response.current_response,
      is_favorite: response.is_favorite,
      tags: response.response_tags || [],
      notes: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/responses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Response deleted successfully!');
      loadResponses();
    } catch (error) {
      console.error('Error deleting response:', error);
      showMessage('Failed to delete response', 'error');
    }
  };

  const toggleFavorite = async (response) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/responses/${response.id}`, 
        { is_favorite: !response.is_favorite },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadResponses();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const addTag = () => {
    if (!tagInput.tag_value) return;
    
    setFormData({
      ...formData,
      tags: [...formData.tags, { ...tagInput }],
    });
    setTagInput({ tag_type: 'skill', tag_value: '' });
  };

  const getSuggestedResponses = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/responses/suggest?job_id=${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestedResponses(response.data);
      setShowJobSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      showMessage('Failed to get response suggestions', 'error');
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    getSuggestedResponses(job.id);
  };

  const removeTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'behavioral',
      question_category: '',
      current_response: '',
      is_favorite: false,
      tags: [],
      notes: '',
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      behavioral: 'bg-blue-100 text-blue-800',
      technical: 'bg-purple-100 text-purple-800',
      situational: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading responses...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Interview Response Library</h1>
          <p className="text-gray-600 mt-1">Build and refine your interview answers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/responses/analytics')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📊 Analytics
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingResponse(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Response
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Job Selector */}
      {jobs.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">Prepare for a Specific Job</h3>
            {selectedJob && (
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setShowJobSuggestions(false);
                  setSuggestedResponses([]);
                }}
                className="text-sm text-blue-700 hover:text-blue-900"
              >
                Clear Selection
              </button>
            )}
          </div>
          <select
            value={selectedJob?.id || ''}
            onChange={(e) => {
              const job = jobs.find(j => j.id === e.target.value);
              if (job) handleJobSelect(job);
            }}
            className="w-full px-4 py-2 border border-blue-300 rounded-lg bg-white"
          >
            <option value="">Select a job to get response suggestions...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.position} at {job.company} ({job.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Suggested Responses */}
      {showJobSuggestions && selectedJob && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">
            💡 Suggested Responses for {selectedJob.company}
          </h3>
          {suggestedResponses.length === 0 ? (
            <p className="text-sm text-gray-600">
              No matching responses found. Create responses tagged with relevant skills for this job.
            </p>
          ) : (
            <div className="space-y-2">
              {suggestedResponses.map((response) => (
                <div
                  key={response.id}
                  className="bg-white border border-green-300 rounded-lg p-3 hover:bg-green-50 cursor-pointer"
                  onClick={() => navigate(`/responses/practice/${response.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">{response.question_text}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {response.question_type}
                        </span>
                        {response.success_rate !== null && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            {response.success_rate}% success
                          </span>
                        )}
                        {response.relevance_score && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                            {response.relevance_score} matching skills
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/responses/practice/${response.id}`);
                      }}
                      className="ml-3 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      Practice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <select
          value={questionTypeFilter}
          onChange={(e) => setQuestionTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Types</option>
          <option value="behavioral">Behavioral</option>
          <option value="technical">Technical</option>
          <option value="situational">Situational</option>
        </select>

        <input
          type="text"
          placeholder="Category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={favoriteFilter}
            onChange={(e) => setFavoriteFilter(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Favorites Only</span>
        </label>
      </div>

      {/* Responses Grid */}
      {responses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No responses yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Your First Response
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {responses.map((response) => (
            <div key={response.id} className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(response.question_type)}`}>
                  {response.question_type}
                </span>
                <button
                  onClick={() => toggleFavorite(response)}
                  className="text-xl"
                >
                  {response.is_favorite ? '⭐' : '☆'}
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{response.question_text}</h3>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {response.current_response}
              </p>

              {response.question_category && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs mb-2">
                  {response.question_category}
                </span>
              )}

              {response.response_tags && response.response_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {response.response_tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {tag.tag_value}
                    </span>
                  ))}
                  {response.response_tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{response.response_tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 text-xs text-gray-500 mb-3">
                {response.practice_count > 0 && (
                  <span>🎯 {response.practice_count} practices</span>
                )}
                {response.success_rate !== null && (
                  <span>✅ {response.success_rate}% success</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/responses/practice/${response.id}`)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                >
                  Practice
                </button>
                <button
                  onClick={() => handleEdit(response)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(response.id)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto pt-12">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 relative">
            <button
              onClick={() => {
                setShowModal(false);
                setEditingResponse(null);
                resetForm();
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-6">
              {editingResponse ? 'Edit Response' : 'Add New Response'}
            </h2>

            <div className="bg-red-100 border-2 border-red-500 p-4 rounded-lg mb-4 text-center">
              <p className="text-red-900 font-bold text-lg">⚠️ SCROLL TO SEE ALL FIELDS ⚠️</p>
              <p className="text-red-700 text-sm">Make sure to fill in the Interview Question field below!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg">
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  1️⃣ Interview Question * (Required)
                </label>
                <p className="text-xs text-gray-600 mb-1">Current value: "{formData.question_text}"</p>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => {
                    console.log('Question text changed to:', e.target.value);
                    setFormData({...formData, question_text: e.target.value});
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows="2"
                  placeholder="Type the interview question here (e.g., Tell me about a time when you had to deal with a difficult stakeholder)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">2️⃣ Question Type *</label>
                  <select
                    value={formData.question_type}
                    onChange={(e) => setFormData({...formData, question_type: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="behavioral">Behavioral</option>
                    <option value="technical">Technical</option>
                    <option value="situational">Situational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">3️⃣ Category (Optional)</label>
                  <input
                    type="text"
                    value={formData.question_category}
                    onChange={(e) => setFormData({...formData, question_category: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., leadership, problem-solving"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">4️⃣ Your Response * (Required)</label>
                <p className="text-xs text-gray-600 mb-1">Current value: "{formData.current_response}"</p>
                <textarea
                  value={formData.current_response}
                  onChange={(e) => {
                    console.log('Response text changed to:', e.target.value);
                    setFormData({...formData, current_response: e.target.value});
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows="8"
                  placeholder="Write your detailed response here..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Word count: {formData.current_response.trim().split(/\s+/).filter(w => w).length}
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={tagInput.tag_type}
                    onChange={(e) => setTagInput({...tagInput, tag_type: e.target.value})}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="skill">Skill</option>
                    <option value="experience">Experience</option>
                    <option value="company">Company</option>
                    <option value="industry">Industry</option>
                    <option value="role">Role</option>
                  </select>
                  <input
                    type="text"
                    value={tagInput.tag_value}
                    onChange={(e) => setTagInput({...tagInput, tag_value: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="Tag value..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                      <span className="text-xs opacity-75">{tag.tag_type}:</span>
                      {tag.tag_value}
                      <button
                        type="button"
                        onClick={() => removeTag(idx)}
                        className="text-blue-900 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_favorite}
                    onChange={(e) => setFormData({...formData, is_favorite: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Mark as favorite</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingResponse(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingResponse ? 'Update' : 'Create'} Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
