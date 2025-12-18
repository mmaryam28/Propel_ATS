import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function PracticeMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [practicing, setPracticing] = useState(false);
  
  // Practice state
  const [practiceText, setPracticeText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadResponse();
    loadPracticeHistory();
  }, [id]);

  const loadResponse = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/responses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResponse(res.data);
    } catch (error) {
      console.error('Error loading response:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPracticeHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/responses/${id}/practice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPracticeHistory(res.data || []);
    } catch (error) {
      console.error('Error loading practice history:', error);
    }
  };

  const startPractice = () => {
    setPracticing(true);
    setPracticeText('');
    setFeedback(null);
    setShowFeedback(false);
    setStartTime(Date.now());
    setIsRecording(true);
  };

  const stopPractice = () => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setDeliveryTime(elapsed);
    }
    setIsRecording(false);
  };

  const submitPractice = async () => {
    if (!practiceText.trim()) {
      alert('Please enter your practice response');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API}/responses/${id}/practice`,
        {
          practice_text: practiceText,
          delivery_time: deliveryTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Practice feedback response:', res.data);
      
      if (!res.data) {
        throw new Error('No feedback data received');
      }

      setFeedback(res.data);
      setShowFeedback(true);
      setPracticing(false);
      
      // Reload to get updated practice count and history
      loadResponse();
      loadPracticeHistory();
    } catch (error) {
      console.error('Error submitting practice:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to get feedback: ${error.response?.data?.message || error.message}`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
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
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!response) {
    return <div className="p-8 text-center">Response not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/responses')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← Back to Library
          </button>
          <h1 className="text-3xl font-bold text-black">Practice Mode</h1>
        </div>
        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(response.question_type)}`}>
          {response.question_type}
        </span>
      </div>

      {/* Question */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">Interview Question</h2>
        <p className="text-lg text-gray-900">{response.question_text}</p>
        
        {response.question_category && (
          <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {response.question_category}
          </span>
        )}
      </div>

      {/* Original Response (Collapsible) */}
      <details className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <summary className="font-semibold cursor-pointer text-blue-900">
          📝 View Your Prepared Response
        </summary>
        <div className="mt-4 text-gray-700 whitespace-pre-wrap">
          {response.current_response}
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <span>Words: {response.current_response.trim().split(/\s+/).length}</span>
          {response.response_versions && response.response_versions[0]?.estimated_duration && (
            <span className="ml-4">
              Est. Time: {Math.floor(response.response_versions[0].estimated_duration / 60)}:{(response.response_versions[0].estimated_duration % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      </details>

      {/* Practice History */}
      {practiceHistory.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-6 mb-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between font-semibold text-gray-900"
          >
            <span>📊 Previous Practice Sessions ({practiceHistory.length})</span>
            <span>{showHistory ? '▼' : '▶'}</span>
          </button>
          
          {showHistory && (
            <div className="mt-4 space-y-3">
              {practiceHistory.slice().reverse().map((session, idx) => (
                <div key={session.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      Practice #{practiceHistory.length - idx}
                    </span>
                    <div className="flex items-center gap-3">
                      {session.delivery_time > 0 && (
                        <span className="text-sm text-gray-600">
                          ⏱️ {formatTime(session.delivery_time)}
                        </span>
                      )}
                      <span className={`text-lg font-bold ${getScoreColor(session.ai_score)}`}>
                        {session.ai_score}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString()}
                  </div>
                  
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                      View Response & Feedback
                    </summary>
                    
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <p className="font-medium text-gray-900 mb-2">Your Response:</p>
                      <p className="text-gray-700 whitespace-pre-wrap mb-4">{session.practice_text}</p>
                      
                      {session.ai_feedback && (
                        <>
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {Object.entries(session.ai_feedback.score_breakdown).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <div className={`text-sm font-bold ${getScoreColor(value)}`}>
                                  {value}/10
                                </div>
                                <div className="text-xs text-gray-600 capitalize">{key}</div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mb-2">
                            <p className="font-medium text-green-700 text-xs mb-1">✅ Strengths:</p>
                            <ul className="list-disc list-inside text-xs text-gray-700">
                              {session.ai_feedback.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <p className="font-medium text-yellow-700 text-xs mb-1">💡 Improvements:</p>
                            <ul className="list-disc list-inside text-xs text-gray-700">
                              {session.ai_feedback.improvements.map((imp, i) => (
                                <li key={i}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Practice Area */}
      {!practicing && !showFeedback && (
        <div className="bg-white border rounded-lg p-6 mb-6 text-center">
          <h3 className="text-xl font-semibold text-black mb-4">Ready to Practice?</h3>
          <p className="text-gray-600 mb-6">
            Try answering this question without looking at your prepared response.
            You'll receive AI-powered feedback on your delivery.
          </p>
          <button
            onClick={startPractice}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
          >
            🎯 Start Practice Session
          </button>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Practice count: {response.practice_count || 0} sessions</p>
          </div>
        </div>
      )}

      {/* Practice Input */}
      {practicing && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-black">Your Practice Response</h3>
            <div className="flex items-center gap-4">
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-mono text-lg">{formatTime(Math.floor((Date.now() - startTime) / 1000))}</span>
                </div>
              )}
              <button
                onClick={isRecording ? stopPractice : () => setIsRecording(true)}
                className={`px-4 py-2 rounded-lg ${
                  isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRecording ? '⏸ Pause Timer' : '▶️ Resume Timer'}
              </button>
            </div>
          </div>

          <textarea
            value={practiceText}
            onChange={(e) => setPracticeText(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg"
            rows="12"
            placeholder="Type or paste your practice response here..."
            autoFocus
          />

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Word count: {practiceText.trim().split(/\s+/).filter(w => w).length}
              {deliveryTime > 0 && <span className="ml-4">Time: {formatTime(deliveryTime)}</span>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPracticing(false);
                  setPracticeText('');
                  setDeliveryTime(0);
                  setIsRecording(false);
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitPractice}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Get AI Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && feedback && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white border rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-black mb-4">Practice Session Feedback</h3>
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(feedback.ai_score)}`}>
                {feedback.ai_score}/10
              </div>
              <p className="text-gray-600">Overall Score</p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(feedback.ai_feedback.score_breakdown).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className={`text-3xl font-bold mb-1 ${getScoreColor(value)}`}>
                    {value}/10
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-green-900">✅ Strengths</h3>
            <ul className="space-y-2">
              {feedback.ai_feedback.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-900">💡 Areas for Improvement</h3>
            <ul className="space-y-2">
              {feedback.ai_feedback.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Comparison */}
          {feedback.comparison_to_original && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">📊 Comparison to Original</h3>
              <p className="text-gray-700">{feedback.comparison_to_original}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setShowFeedback(false);
                setFeedback(null);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Practice Again
            </button>
            <button
              onClick={() => navigate('/responses')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back to Library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
