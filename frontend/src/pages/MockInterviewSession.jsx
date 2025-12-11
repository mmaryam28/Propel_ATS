import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

export default function MockInterviewSession() {
  const { interviewId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { interview, prep } = location.state || {};
  
  // Session state
  const [phase, setPhase] = useState('intro'); // intro, active, summary
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    if (!interview || !prep?.mockInterview) {
      navigate('/jobs/calendar');
      return;
    }
    
    // Initialize session data
    const questions = prep.mockInterview.questions || [];
    setSessionData({
      interviewId,
      companyName: interview.company_name || interview.job?.company || 'Company',
      roleTitle: interview.job_title || interview.title || interview.job?.title || 'Role',
      intro: prep.mockInterview.intro,
      questions,
      summary: prep.mockInterview.summary,
    });
  }, [interview, prep, interviewId, navigate]);

  const startInterview = () => {
    setPhase('active');
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const handleResponseChange = (value) => {
    setResponses({
      ...responses,
      [currentQuestionIndex]: {
        text: value,
        timeSpent: Math.floor((Date.now() - questionStartTime) / 1000),
      },
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < sessionData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    } else {
      finishInterview();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const finishInterview = () => {
    setPhase('summary');
    
    // Save to localStorage for persistence
    const sessionResult = {
      interviewId,
      completedAt: new Date().toISOString(),
      totalTime: Math.floor((Date.now() - startTime) / 1000),
      responses,
      sessionData,
    };
    
    const savedSessions = JSON.parse(localStorage.getItem('mockInterviewSessions') || '[]');
    savedSessions.push(sessionResult);
    localStorage.setItem('mockInterviewSessions', JSON.stringify(savedSessions));
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading interview...</div>
      </div>
    );
  }

  const currentQuestion = sessionData.questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestionIndex]?.text || '';
  const wordCount = currentResponse.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = Math.ceil(wordCount / 150); // ~150 words per minute speaking

  // Calculate performance metrics for summary
  const calculatePerformance = () => {
    const totalQuestions = sessionData.questions.length;
    const answeredQuestions = Object.keys(responses).filter(
      (key) => responses[key]?.text?.trim()
    ).length;
    const totalWords = Object.values(responses).reduce(
      (sum, r) => sum + (r?.text?.trim().split(/\s+/).filter(Boolean).length || 0),
      0
    );
    const avgWordsPerQuestion = Math.round(totalWords / totalQuestions);
    const totalTimeMinutes = Math.floor((Date.now() - startTime) / 60000);

    return {
      totalQuestions,
      answeredQuestions,
      completionRate: Math.round((answeredQuestions / totalQuestions) * 100),
      totalWords,
      avgWordsPerQuestion,
      totalTimeMinutes,
    };
  };

  const analyzeResponseQuality = (response, questionType) => {
    if (!response) return { quality: 'no-response', issues: [], strengths: [] };
    
    const text = response.trim().toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const issues = [];
    const strengths = [];

    // Check for vague language
    const vagueWords = ['thing', 'stuff', 'good', 'bad', 'nice', 'okay', 'fine', 'some', 'maybe', 'kind of', 'sort of'];
    const vagueCount = vagueWords.filter(word => text.includes(word)).length;
    if (vagueCount > 2) {
      issues.push('Uses vague language - be more specific with examples and details');
    }

    // Check for first-person perspective
    const hasFirstPerson = text.includes('i ') || text.includes("i'm") || text.includes('my ') || text.includes('me ');
    if (!hasFirstPerson && questionType.toLowerCase() === 'behavioral') {
      issues.push('Missing personal examples - behavioral questions should highlight YOUR specific experiences');
    } else if (hasFirstPerson) {
      strengths.push('Uses personal examples effectively');
    }

    // Check for STAR method indicators in behavioral questions
    if (questionType.toLowerCase() === 'behavioral') {
      const hasSituation = text.includes('when') || text.includes('situation') || text.includes('time') || text.includes('project');
      const hasAction = text.includes('i did') || text.includes('i created') || text.includes('i developed') || text.includes('i led') || text.includes('i worked');
      const hasResult = text.includes('result') || text.includes('outcome') || text.includes('achieved') || text.includes('success') || text.includes('improved');
      
      if (!hasSituation && !hasAction && !hasResult) {
        issues.push('Lacks STAR structure - include Situation, Task, Action, and Result');
      } else if (hasSituation && hasAction && hasResult) {
        strengths.push('Follows STAR method structure');
      }
    }

    // Check for technical depth in technical questions
    if (questionType.toLowerCase() === 'technical') {
      const technicalTerms = text.match(/\b[a-z]+\.(js|py|java|sql)\b|\b(api|database|framework|library|algorithm|function|class|method)\b/gi);
      if (!technicalTerms || technicalTerms.length < 2) {
        issues.push('Lacks technical specificity - mention specific technologies, tools, or concepts');
      } else {
        strengths.push('Demonstrates technical knowledge with specific terms');
      }
    }

    // Check for quantifiable results
    const hasNumbers = /\d+/.test(text);
    const hasPercentage = text.includes('%') || text.includes('percent');
    if ((hasNumbers || hasPercentage) && (text.includes('improve') || text.includes('increase') || text.includes('reduce') || text.includes('save'))) {
      strengths.push('Includes quantifiable achievements');
    }

    // Check length appropriateness
    if (wordCount < 50) {
      issues.push('Response is too brief - add more context and details');
    } else if (wordCount > 300) {
      issues.push('Response may be too long - practice being more concise');
    } else {
      strengths.push('Appropriate response length');
    }

    // Check for enthusiasm/engagement indicators
    const enthusiasmWords = ['excited', 'passionate', 'love', 'enjoy', 'interested', 'eager', 'motivated'];
    if (enthusiasmWords.some(word => text.includes(word))) {
      strengths.push('Shows enthusiasm and engagement');
    }

    return {
      quality: issues.length === 0 ? 'excellent' : issues.length <= 2 ? 'good' : 'needs-improvement',
      issues,
      strengths,
      wordCount,
    };
  };

  const getImprovementAreas = (performance) => {
    const areas = [];
    const responseAnalysis = {};
    
    // Analyze each response
    sessionData.questions.forEach((question, idx) => {
      const response = responses[idx]?.text || '';
      responseAnalysis[idx] = analyzeResponseQuality(response, question.type);
    });

    // Check completion rate
    if (performance.completionRate < 100) {
      areas.push({
        area: 'Question Coverage',
        issue: 'Some questions were skipped or left incomplete',
        recommendation: 'Practice answering all questions, even if briefly. Skipping questions in a real interview leaves a negative impression.',
        priority: 'high',
      });
    }

    // Analyze response quality patterns
    const allIssues = Object.values(responseAnalysis).flatMap(r => r.issues);
    const issueFrequency = {};
    allIssues.forEach(issue => {
      const key = issue.split(' - ')[0];
      issueFrequency[key] = (issueFrequency[key] || 0) + 1;
    });

    // Most common issues become improvement areas
    Object.entries(issueFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([issue, count]) => {
        const fullIssue = allIssues.find(i => i.startsWith(issue));
        areas.push({
          area: issue,
          issue: `Found in ${count} of ${sessionData.questions.length} responses`,
          recommendation: fullIssue.split(' - ')[1] || 'Review and improve this aspect',
          priority: count > sessionData.questions.length / 2 ? 'high' : 'medium',
        });
      });

    // Check for behavioral question quality
    const behavioralQs = sessionData.questions
      .map((q, idx) => ({ ...q, idx }))
      .filter(q => q.type.toLowerCase() === 'behavioral');
    
    if (behavioralQs.length > 0) {
      const behavioralWithoutStar = behavioralQs.filter(
        q => responseAnalysis[q.idx]?.issues.some(i => i.includes('STAR'))
      );
      
      if (behavioralWithoutStar.length > 0) {
        areas.push({
          area: 'STAR Method Application',
          issue: `${behavioralWithoutStar.length} behavioral response(s) lack clear STAR structure`,
          recommendation: 'Structure each behavioral answer: Situation (context), Task (challenge), Action (what YOU did), Result (outcome with metrics)',
          priority: 'high',
        });
      }
    }

    // Check for technical depth
    const technicalQs = sessionData.questions
      .map((q, idx) => ({ ...q, idx }))
      .filter(q => q.type.toLowerCase() === 'technical');
    
    if (technicalQs.length > 0) {
      const technicalLackingDepth = technicalQs.filter(
        q => responseAnalysis[q.idx]?.issues.some(i => i.includes('technical specificity'))
      );
      
      if (technicalLackingDepth.length > 0) {
        areas.push({
          area: 'Technical Depth',
          issue: `${technicalLackingDepth.length} technical response(s) need more specific details`,
          recommendation: 'Name specific technologies, frameworks, tools, and methodologies. Explain HOW you approached technical challenges.',
          priority: 'medium',
        });
      }
    }

    // Check for quantifiable results
    const responsesWithoutMetrics = Object.values(responseAnalysis).filter(
      r => !r.strengths.includes('Includes quantifiable achievements') && r.wordCount > 0
    );
    
    if (responsesWithoutMetrics.length > sessionData.questions.length / 2) {
      areas.push({
        area: 'Quantifiable Impact',
        issue: 'Most responses lack measurable results',
        recommendation: 'Add numbers and metrics: "increased by 30%", "reduced time by 2 hours", "managed team of 5". Concrete results are memorable.',
        priority: 'medium',
      });
    }

    // Positive feedback if quality is high
    const excellentResponses = Object.values(responseAnalysis).filter(r => r.quality === 'excellent').length;
    if (excellentResponses > sessionData.questions.length / 2 && areas.length < 2) {
      areas.push({
        area: 'Overall Quality',
        issue: null,
        recommendation: `${excellentResponses} responses were excellent! Focus on maintaining this quality and refining the remaining answers.`,
        priority: 'low',
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    areas.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return { areas, responseAnalysis };
  };

  // Intro Phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/jobs/calendar')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <span className="text-xl">←</span>
            Back to Calendar
          </button>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mock Interview Practice
              </h1>
              <p className="text-lg text-gray-600">
                {sessionData.roleTitle} at {sessionData.companyName}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">About this session</h2>
              <p className="text-gray-700 mb-4">{sessionData.intro}</p>
              <div className="text-sm text-gray-600">
                <p>• {sessionData.questions.length} questions covering multiple topics</p>
                <p>• Practice writing your responses as you would speak them</p>
                <p>• Track your time and word count for pacing</p>
                <p>• Review performance summary at the end</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Confidence Building Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600 font-semibold">1.</span>
                  <span><strong>Use STAR method:</strong> Situation, Task, Action, Result for behavioral questions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-semibold">2.</span>
                  <span><strong>Think before answering:</strong> Take a moment to structure your thoughts</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-semibold">3.</span>
                  <span><strong>Be specific:</strong> Use concrete examples from your experience</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-semibold">4.</span>
                  <span><strong>Show enthusiasm:</strong> Express genuine interest in the role and company</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-semibold">5.</span>
                  <span><strong>Practice out loud:</strong> After writing, read your responses aloud</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-amber-600">⏱️</span>
                Pacing Recommendations
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• <strong>Behavioral questions:</strong> 1.5-2 minutes (150-200 words)</p>
                <p>• <strong>Technical questions:</strong> 2-3 minutes (200-300 words)</p>
                <p>• <strong>Situational questions:</strong> 1-2 minutes (100-200 words)</p>
                <p>• <strong>Company-specific:</strong> 1-1.5 minutes (100-150 words)</p>
              </div>
            </div>

            <button
              onClick={startInterview}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Interview Phase
  if (phase === 'active') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {sessionData.questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(((currentQuestionIndex + 1) / sessionData.questions.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / sessionData.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {currentQuestion.type}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentQuestion.text}
                  </h2>
                </div>
              </div>

              {/* Response guidance based on question type */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Response Guidance:
                </h3>
                {currentQuestion.type.toLowerCase() === 'behavioral' && (
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Describe a specific situation from your experience</li>
                    <li>• Explain the task or challenge you faced</li>
                    <li>• Detail the actions you took</li>
                    <li>• Share the results and what you learned</li>
                  </ul>
                )}
                {currentQuestion.type.toLowerCase() === 'technical' && (
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Demonstrate your technical knowledge clearly</li>
                    <li>• Use specific examples from projects</li>
                    <li>• Explain your thought process</li>
                    <li>• Mention relevant tools and technologies</li>
                  </ul>
                )}
                {currentQuestion.type.toLowerCase() === 'situational' && (
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Explain your approach step-by-step</li>
                    <li>• Consider multiple perspectives</li>
                    <li>• Show problem-solving skills</li>
                    <li>• Demonstrate leadership or collaboration</li>
                  </ul>
                )}
              </div>
            </div>

            {/* Response textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={currentResponse}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Type your response here as you would speak it..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Metrics */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Word Count</div>
                <div className="text-2xl font-semibold text-gray-900">{wordCount}</div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Est. Speaking Time</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {estimatedMinutes === 0 ? '<1' : estimatedMinutes} min
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Time on Question</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {responses[currentQuestionIndex]?.timeSpent || 0}s
                </div>
              </div>
            </div>

            {/* Length indicator */}
            <div className="mb-6">
              {wordCount < 50 && currentResponse && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <span>⚠️</span>
                  Consider adding more detail to your response
                </div>
              )}
              {wordCount >= 50 && wordCount <= 250 && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <span>✓</span>
                  Good response length
                </div>
              )}
              {wordCount > 250 && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <span>⚠️</span>
                  Consider being more concise
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextQuestion}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                {currentQuestionIndex === sessionData.questions.length - 1
                  ? 'Finish Interview'
                  : 'Next Question'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Summary Phase
  if (phase === 'summary') {
    const performance = calculatePerformance();
    const { areas: improvementAreas, responseAnalysis } = getImprovementAreas(performance);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 text-4xl">
                ✓
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview Complete!
              </h1>
              <p className="text-gray-600">
                Great job practicing for {sessionData.roleTitle} at {sessionData.companyName}
              </p>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {performance.completionRate}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {performance.answeredQuestions}/{performance.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Questions Answered</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {performance.avgWordsPerQuestion}
                </div>
                <div className="text-sm text-gray-600">Avg Words/Question</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {performance.totalTimeMinutes}
                </div>
                <div className="text-sm text-gray-600">Minutes Spent</div>
              </div>
            </div>

            {/* Improvement Areas */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Performance Analysis & Improvement Areas
              </h2>
              <div className="space-y-4">
                {improvementAreas.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`rounded-lg p-4 ${
                      item.priority === 'high' 
                        ? 'bg-red-50 border border-red-200' 
                        : item.priority === 'medium'
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                        item.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.priority === 'high' ? 'High Priority' : item.priority === 'medium' ? 'Medium' : 'Good'}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.area}</h3>
                        {item.issue && (
                          <p className="text-sm text-gray-600 mb-2">Issue: {item.issue}</p>
                        )}
                        <p className="text-sm text-gray-700">
                          <strong>Recommendation:</strong> {item.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Quality Analysis */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Response Quality Breakdown
              </h2>
              <div className="space-y-3">
                {sessionData.questions.map((question, idx) => {
                  const analysis = responseAnalysis[idx];
                  if (!analysis || !responses[idx]?.text) return null;
                  
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                              Q{idx + 1}: {question.type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              analysis.quality === 'excellent'
                                ? 'bg-green-100 text-green-700'
                                : analysis.quality === 'good'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {analysis.quality === 'excellent' ? '✓ Excellent' : analysis.quality === 'good' ? 'Good' : 'Needs Work'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{question.text}</p>
                        </div>
                        <div className="text-sm text-gray-500 ml-4">
                          {analysis.wordCount} words
                        </div>
                      </div>

                      {analysis.strengths.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-green-700 mb-1">✓ Strengths:</div>
                          <ul className="text-xs text-green-600 space-y-0.5">
                            {analysis.strengths.map((strength, i) => (
                              <li key={i}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.issues.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-amber-700 mb-1">⚠ Areas to Improve:</div>
                          <ul className="text-xs text-amber-600 space-y-0.5">
                            {analysis.issues.map((issue, i) => (
                              <li key={i}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Responses */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Responses</h2>
              <div className="space-y-4">
                {sessionData.questions.map((question, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {question.type}
                      </span>
                      <h3 className="font-medium text-gray-900 flex-1">{question.text}</h3>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {responses[idx]?.text || '(No response provided)'}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {responses[idx]?.text && (
                        <>
                          {responses[idx].text.trim().split(/\s+/).filter(Boolean).length} words •{' '}
                          {responses[idx].timeSpent}s
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing advice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
              <p className="text-gray-700 mb-4">{sessionData.summary}</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Review your responses and refine weak areas</li>
                <li>• Practice speaking your answers out loud</li>
                <li>• Research the company further based on questions asked</li>
                <li>• Consider doing another practice session</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/jobs/calendar')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back to Calendar
              </button>
              <button
                onClick={() => {
                  setPhase('intro');
                  setCurrentQuestionIndex(0);
                  setResponses({});
                  setStartTime(null);
                  setQuestionStartTime(null);
                }}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
