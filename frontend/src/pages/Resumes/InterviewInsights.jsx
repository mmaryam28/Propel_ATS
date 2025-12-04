import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

const PRACTICE_QUESTIONS = [
  "Tell me about yourself.",
  "Describe a time you overcame a challenge.",
  "Talk about a project you're proud of.",
  "Explain a conflict you resolved.",
  "Why do you want to work here?",
  "Tell me about a mistake you made and what you learned."
];


const InterviewInsights = () => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [interviewDate, setInterviewDate] = useState("");
  const [format, setFormat] = useState("");
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [checklist, setChecklist] = useState(null);
  const [checklistError, setChecklistError] = useState(null);
  const [completedItems, setCompletedItems] = useState({});
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [interviewerName, setInterviewerName] = useState('');
  const [outcome, setOutcome] = useState('pending'); // 'pending' | 'rejected' | 'offer' | 'no_response'
  const [topics, setTopics] = useState(''); // comma or line separated topics discussed
  const [followUpTemplates, setFollowUpTemplates] = useState(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState(null);
  const [followUpSuccess, setFollowUpSuccess] = useState(null);
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [checklistSuggestions, setChecklistSuggestions] = useState([]);
  const [memorableSuggestions, setMemorableSuggestions] = useState(null);
  const [nervesChecklist, setNervesChecklist] = useState({});
  const [warmupNotes, setWarmupNotes] = useState({
    strengths: '',
    wins: '',
    story: '',
  });
  const [successScore, setSuccessScore] = useState(null);
  const [successLoading, setSuccessLoading] = useState(false);
  const [successError, setSuccessError] = useState(null);


  useEffect(() => {
    if (!timerActive || timeLeft === null) return;
    if (timeLeft === 0) {
      setTimerActive(false);
      analyzeResponse();
      return;
    }
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const userId = localStorage.getItem("userId") || "demo-user";
  
  const handleSearch = async () => {
    if (!company.trim()) {
      setError('Please enter a company name');
      return;
    }

    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const response = await axios.get(`http://localhost:3000/interview/insights`, {
        params: { 
          company: company.trim(), 
          role: role.trim() || undefined 
        }
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setInsights(response.data);
      }
    } catch (err) {
      console.error('Error fetching interview insights:', err);
      setError('Failed to fetch interview insights. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchChecklist = async (e) => {
    e.preventDefault();
    if (!company.trim()) {
      setChecklistError("Company is required.");
      return;
    }

    setChecklistError(null);
    setLoadingChecklist(true);

    try {
      const res = await axios.get(
        "http://localhost:3000/interview/prep-checklist",
        {
          params: {
            company: company.trim(),
            role: role.trim() || undefined,
            interviewDate: interviewDate || undefined,
            format: format || undefined,
          },
        }
      );

      setChecklist(res.data);
      setCompletedItems({});
    } catch (err) {
      console.error(err);
      setChecklistError("Failed to generate checklist.");
    } finally {
      setLoadingChecklist(false);
    }
  };

    const handleGenerateFollowUps = async () => {
    if (!company.trim()) {
      setFollowUpError('Please enter a company name first.');
      return;
    }

    setFollowUpError(null);
    setFollowUpSuccess(null);
    setFollowUpLoading(true);
    setFollowUpTemplates(null);

    try {
      const response = await axios.get('http://localhost:3000/interview/follow-up-templates', {
        params: {
          company: company.trim(),
          role: role.trim() || undefined,
          interviewerName: interviewerName.trim() || undefined,
          interviewDate: interviewDate || undefined,
          outcome,
          // send topics as comma-separated string
          topics: topics
            .split('\n')
            .join(',')
        },
      });

      if (response.data.error) {
        setFollowUpError(response.data.error);
      } else {
        setFollowUpTemplates(response.data.templates);
      }
    } catch (err) {
      console.error('Error fetching follow-up templates:', err);
      setFollowUpError('Failed to generate follow-up templates. Please try again.');
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Log the follow-up as "sent" for tracking
  const handleLogFollowUpSent = async (type) => {
    try {
      setFollowUpSuccess(null);
      await axios.post('http://localhost:3000/interview/analytics/follow-up-event', {
        userId,
        company: company || followUpTemplates?.company,
        role: role || followUpTemplates?.role,
        interviewerName,
        type,               // 'thank_you' | 'status_inquiry' | 'feedback_request' | 'networking'
        status: 'sent',
        channel: 'email',
        sentAt: new Date().toISOString(),
      });

      setFollowUpSuccess(`Marked ${type.replace('_', ' ')} follow-up as sent and logged for tracking.`);
    } catch (err) {
      console.error('Error logging follow-up event:', err);
      setFollowUpError('Follow-up was generated but tracking failed. Please try again later.');
    }
  };

  const analyzeResponse = async () => {
    if (!responseText.trim()) return;

    const payload = {
      userId,
      question: practiceQuestion,
      response: responseText,
    };

    try {
      const res = await axios.post(
        'http://localhost:3000/interview/insights/analyze-response',
        payload
      );

      const result = {
        ...res.data,
        question: practiceQuestion,
      };

      setPracticeResult(result);

      // Track progression over time with timestamps
      setPracticeHistory((prev) => [
        ...prev,
        { ...result, createdAt: new Date().toISOString() },
      ]);

      // Drive checklist suggestions from this attempt
      setChecklistSuggestions(generateChecklistSuggestions(result));

      // Reset memorable suggestions whenever a new analysis comes in
      setMemorableSuggestions(null);
    } catch (err) {
      console.error('Error analyzing response:', err);
    }
  };


  const generateChecklistSuggestions = (result) => {
    const suggestions = [];
    if (!result) return suggestions;

    if (result.clarityScore < 8) {
      suggestions.push({
        id: 'clarity-outline',
        label: 'Create a 1–2 sentence outline before answering behavioral questions',
        description:
          'Write down Situation → Action → Result or 3 bullet points before you start speaking.',
      });
    }

    if (result.structureScore < 8) {
      suggestions.push({
        id: 'star-rehearsal',
        label: 'Rehearse 3 STAR stories for this interview',
        description:
          'Pick examples that show impact, ownership, and learning related to this role.',
      });
    }

    if (result.professionalismScore < 8) {
      suggestions.push({
        id: 'tone-review',
        label: 'Do a tone and filler-word review',
        description:
          'Record yourself once and note any casual language, filler words, or run-on sentences.',
      });
    }

    // Always suggest one more timed round – reinforces “track improvement over time”
    suggestions.push({
      id: 'repeat-practice',
      label: 'Schedule one more timed practice round',
      description:
        'Repeat this question under the 3-minute timer to reinforce improvements.',
    });

    return suggestions;
  };

  const handleGenerateMemorableSuggestions = () => {
    if (!practiceResult || !responseText.trim()) return;

    const targetCompany = company || 'this team';

    const hooks = [
      '“One experience that really changed how I work was…”',
      '“Let me walk you through a story that shows how I handle challenges.”',
      '“A good example of how I approach problems came from a recent project…”',
      `“One of the clearest ways I can show what I’d bring to ${targetCompany} is this story…”`,
    ];

    const closings = [
      'Overall, this experience shows how I stay calm under pressure and focus on outcomes.',
      `That story captures how I collaborate, communicate, and follow through—things I’d bring to ${targetCompany}.`,
      'In short, this example reflects the way I learn quickly and turn problems into improvements.',
    ];

    const rewriteTips = [
      'Try opening with the result (“We shipped X on time”), then rewind to explain how you got there.',
      'Cut one extra detail from each sentence and keep only the words that move the story forward.',
      'Aim for 3–4 sentences per STAR section so your answer stays tight but specific.',
    ];

    const powerVerbs = [
      'designed',
      'led',
      'implemented',
      'optimized',
      'launched',
      'debugged',
      'coordinated',
      'automated',
    ];

    setMemorableSuggestions({
      hooks,
      closings,
      rewriteTips,
      powerVerbs,
    });
  };

  const toggleNervesItem = (id) => {
    setNervesChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchSuccessScore = async () => {
    if (!company.trim()) {
      setSuccessError("Please enter a company first.");
      return;
    }

    setSuccessLoading(true);
    setSuccessError(null);

    try {
      const response = await axios.get(
        "http://localhost:3000/interview/success-score",
        {
          params: {
            userId,
            company: company.trim(),
            role: role.trim() || undefined,
            // factors you already track:
            checklistProgress: progressPercent,         // completeness %
            practiceSessions: practiceHistory.length,   // count of attempts
          }
        }
      );

      setSuccessScore(response.data);
    } catch (err) {
      console.error(err);
      setSuccessError("Failed to calculate success probability.");
    } finally {
      setSuccessLoading(false);
    }
  };

  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'preparation', label: 'Preparation', icon: 'timeline' },
    { id: 'questions', label: 'Common Questions', icon: 'help' },
    { id: 'formats', label: 'Writing Tools', icon: 'list' },
    { id: 'practiceTools', label: 'Practice Tools', icon: 'sparkles' },
    { id: 'followup', label: 'Follow-Up Templates', icon: 'mail' }
  ];

  const toggleItem = (sectionId, itemId) => {
    const key = `${sectionId}:${itemId}`;
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const countProgress = () => {
    if (!checklist) return { total: 0, done: 0 };
    const total = checklist.sections.reduce(
      (sum, s) => sum + s.items.length,
      0
    );
    const done = Object.values(completedItems).filter(Boolean).length;
    return { total, done };
  };

  const { total, done } = countProgress();
  const progressPercent = total ? Math.round((done / total) * 100) : 0;

  const TabContent = () => {
    if (!insights) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Icon name="building" size="sm" />
                    Company Information
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-2">
                    <p><strong>Company:</strong> {insights.company}</p>
                    {insights.role && <p><strong>Role:</strong> {insights.role}</p>}
                    <p><strong>Last Updated:</strong> {new Date(insights.lastUpdated).toLocaleDateString()}</p>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Icon name="clock" size="sm" />
                    Timeline Overview
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <p><strong>Expected Duration:</strong> {insights.timeline?.timeline?.estimated_duration || '2-4 weeks'}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This timeline can vary based on company size, role complexity, and current hiring demand.
                  </p>
                </Card.Body>
              </Card>
            </div>

            <Card>
              <Card.Header>
                <Card.Title>Quick Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {insights.process?.stages?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Interview Stages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {insights.questions?.questions?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Common Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {insights.formats?.formats?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Interview Formats</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="mt-4">
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Icon name="trending-up" size="sm" />
                  Interview Success Probability
                </Card.Title>
              </Card.Header>

              <Card.Body>
                {/* Button to calculate */}
                <div className="mb-4">
                  <button
                    onClick={fetchSuccessScore}
                    disabled={successLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {successLoading ? "Calculating..." : "Calculate Success Probability"}
                  </button>
                </div>

                {/* Error */}
                {successError && (
                  <p className="text-red-600 text-sm mb-3">{successError}</p>
                )}

                {/* Display Score */}
                {successScore && (
                  <div className="space-y-4">

                    {/* Score Bar */}
                    <div>
                      <p className="font-semibold text-gray-900">
                        Probability of Success: 
                        <span className="text-blue-600 ml-1">
                          {successScore.score}% 
                        </span>
                      </p>

                      <div className="w-full bg-gray-200 h-3 rounded-full mt-2">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${successScore.score}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <p className="text-sm">
                      <strong>Confidence Level:</strong> {successScore.confidence}
                    </p>

                    {/* Factor Breakdown */}
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="font-semibold mb-2">Factors Considered</p>
                      <ul className="list-disc text-sm ml-4 space-y-1">
                        <li>Preparation completeness: {successScore.factors.prepLevel}%</li>
                        <li>Role match score: {successScore.factors.roleMatch}%</li>
                        <li>Company research: {successScore.factors.companyResearch}%</li>
                        <li>Practice hours: {successScore.factors.practiceHours} hr</li>
                        <li>Historical improvement trends included</li>
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="font-semibold text-blue-900 mb-1">
                        Recommended Improvements
                      </p>
                      <ul className="list-disc ml-4 text-sm text-blue-800 space-y-1">
                        {successScore.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        );

      case 'preparation':
        return (
          <div className="space-y-6">

            {/* === Checklist Builder Form === */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Icon name="clipboard" size="sm" />
                  Build Your Pre-Interview Checklist
                </Card.Title>
              </Card.Header>

              <Card.Body>
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  onSubmit={handleFetchChecklist}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-1 w-full border p-2 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1 w-full border p-2 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Interview Date
                    </label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="mt-1 w-full border p-2 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="mt-1 w-full border p-2 rounded-md"
                    >
                      <option value="">Auto-detect</option>
                      <option value="Phone/Video Call">Phone/Video</option>
                      <option value="Panel">Panel</option>
                      <option value="Technical">Technical</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 text-right">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Generate Checklist
                    </button>
                  </div>
                </form>

                {checklistError && (
                  <p className="text-red-600 text-sm mt-3">{checklistError}</p>
                )}
              </Card.Body>
            </Card>

            {/* === Loading Spinner === */}
            {loadingChecklist && (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
              </div>
            )}

            {/* === Checklist Output === */}
            {checklist && (
              <>
                {/* === Progress Bar === */}
                <Card>
                  <Card.Header>
                    <Card.Title>Checklist Progress</Card.Title>
                  </Card.Header>
                  <Card.Body>

                    <p className="text-sm">
                      {done}/{total} tasks complete
                    </p>

                    <div className="w-full bg-gray-200 h-3 rounded-full mt-2">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                  </Card.Body>
                </Card>

                {/* === Checklist Sections === */}
                <div className="space-y-4">
                  {checklist.sections.map((section) => (
                    <Card key={section.id}>
                      <Card.Header>
                        <Card.Title>{section.title}</Card.Title>
                        {section.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {section.description}
                          </p>
                        )}
                      </Card.Header>

                      <Card.Body>
                        <div className="space-y-2">
                          {section.items.map((item) => {
                            const key = `${section.id}:${item.id}`;
                            const checked = completedItems[key];

                            return (
                              <label
                                key={item.id}
                                className="flex items-start gap-3 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked || false}
                                  onChange={() => toggleItem(section.id, item.id)}
                                  className="mt-1"
                                />
                                <div>
                                  <div className="text-sm font-medium">
                                    {item.label}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-gray-600">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Common Interview Questions</Card.Title>
                {insights.questions?.source && (
                  <p className="text-sm text-gray-500 mt-1">Source: {insights.questions.source}</p>
                )}
              </Card.Header>
              <Card.Body>
                {insights.questions?.questions?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Found {insights.questions.questions.length} interview questions</strong> 
                        {insights.role && ` for ${insights.role} positions`} at {company}.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {insights.questions.questions.map((question, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800 font-medium">{question}</p>
                              <div className="mt-2 text-xs text-gray-500">
                                💡 <em>Tip: Use the STAR method (Situation, Task, Action, Result) to structure your response</em>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-medium text-yellow-800 mb-2">Preparation Strategy</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Practice each question out loud with specific examples</li>
                        <li>• Research {company}'s recent news, products, and company culture</li>
                        <li>• Prepare follow-up questions to show your interest and engagement</li>
                        <li>• Practice with a friend or record yourself to improve delivery</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <p className="text-orange-800">
                        <strong>No company-specific questions found.</strong> This could mean:
                      </p>
                      <ul className="mt-2 text-sm text-orange-700 space-y-1">
                        <li>• Limited public information about {company}'s interview process</li>
                        <li>• The company keeps interview questions confidential</li>
                        <li>• Try searching for "{company} interview experience" on platforms like Glassdoor</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Prepare for these common interview questions instead:</h4>
                      <div className="space-y-3">
                        {[
                          `Why do you want to work at ${company}?`,
                          'Tell me about yourself and your background',
                          'What are your greatest strengths and weaknesses?',
                          'Describe a challenging project you worked on',
                          'Where do you see yourself in 5 years?',
                          'Why are you leaving your current position?'
                        ].map((question, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">
                              {index + 1}
                            </div>
                            <p className="text-gray-700">{question}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        );

      case 'formats':
        return (
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Icon name="edit" size="sm" />
                Interview Response Writing Practice
              </Card.Title>
            </Card.Header>

            <Card.Body className="space-y-6">

              {/* SECTION 1 — Pick a practice question */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Select a Practice Question</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PRACTICE_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPracticeQuestion(q);
                        setResponseText("");
                        setPracticeResult(null);
                        setTimeLeft(180); // 3 minutes
                        setTimerActive(false);
                      }}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-left text-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2 — Timer + Response Input */}
              {practiceQuestion && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                    {practiceQuestion}
                    {timerActive && (
                      <span className="text-red-600 text-sm font-semibold">
                        Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                      </span>
                    )}
                  </h3>

                  <textarea
                    className="w-full border rounded p-3 h-40 text-sm"
                    placeholder="Start writing your response here…"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setTimerActive(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Start Timer (3 min)
                    </button>

                    <button
                      onClick={analyzeResponse}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Submit Response
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 3 — AI FEEDBACK */}
              {practiceResult && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Your Feedback</h3>

                  <div className="p-4 bg-blue-50 rounded border-l-4 border-blue-600">
                    <p className="font-medium text-blue-800">Clarity Score: {practiceResult.clarityScore}/10</p>
                    <p className="text-sm text-blue-700">{practiceResult.clarityFeedback}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded border-l-4 border-green-600">
                    <p className="font-medium text-green-800">Structure Score: {practiceResult.structureScore}/10</p>
                    <p className="text-sm text-green-700">{practiceResult.structureFeedback}</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded border-l-4 border-purple-600">
                    <p className="font-medium text-purple-800">Professionalism: {practiceResult.professionalismScore}/10</p>
                    <p className="text-sm text-purple-700">{practiceResult.professionalismFeedback}</p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded border-l-4 border-orange-600">
                    <p className="font-medium text-orange-800">STAR Breakdown</p>
                    <p className="text-sm text-orange-700 whitespace-pre-line">
                      {practiceResult.starSummary}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded border-l-4 border-red-600">
                    <p className="font-medium text-red-800">Improvement Tips</p>
                    <ul className="list-disc text-sm text-red-700 ml-4">
                      {practiceResult.improvementTips.map((t,i)=>(
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Suggested additions for the virtual prep checklist */}
              {checklistSuggestions.length > 0 && (
                <div className="p-4 bg-sky-50 rounded border-l-4 border-sky-600">
                  <p className="font-medium text-sky-800 mb-1">
                    Suggested additions to your preparation checklist
                  </p>
                  <p className="text-xs text-sky-700 mb-2">
                    These don’t change your checklist automatically, but you can add them on the
                    <span className="font-semibold"> Preparation</span> tab.
                  </p>
                  <ul className="list-disc text-sm text-sky-800 ml-4 space-y-1">
                    {checklistSuggestions.map((item) => (
                      <li key={item.id}>
                        <span className="font-semibold">{item.label}</span>
                          {item.description && (
                            <span className="block text-xs text-sky-700">
                                {item.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                  {/* Button to generate memorable response helpers */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateMemorableSuggestions}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                    >
                      Enhance My Response
                    </button>
                  </div>

                  {/* Memorable response suggestions */}
                  {memorableSuggestions && (
                    <div className="p-4 bg-indigo-50 rounded border-l-4 border-indigo-600 space-y-3">
                      <p className="font-medium text-indigo-800">
                        Make this answer more engaging and memorable
                      </p>

                      <div>
                        <p className="text-xs font-semibold text-indigo-700 mb-1">Hook ideas</p>
                        <ul className="list-disc text-sm text-indigo-800 ml-4 space-y-1">
                          {memorableSuggestions.hooks.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-indigo-700 mb-1">
                          Strong closing lines
                        </p>
                        <ul className="list-disc text-sm text-indigo-800 ml-4 space-y-1">
                          {memorableSuggestions.closings.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-indigo-700 mb-1">
                          Rewrite strategies
                        </p>
                        <ul className="list-disc text-sm text-indigo-800 ml-4 space-y-1">
                          {memorableSuggestions.rewriteTips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-indigo-700 mb-1">Power verbs</p>
                        <p className="text-sm text-indigo-800">
                          Try weaving some of these into your answer:{' '}
                          <span className="font-mono">
                            {memorableSuggestions.powerVerbs.join(', ')}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

              {/* SECTION 4 — HISTORY / PROGRESSION */}
              {practiceHistory.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Your Practice Progression</h3>
                  <div className="space-y-3">
                    {practiceHistory.map((s, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm font-medium text-gray-900 mb-1">{s.question}</p>
                        <p className="text-xs text-gray-600">
                          Clarity {s.clarityScore}/10 • Structure {s.structureScore}/10 • Professionalism {s.professionalismScore}/10
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4b — Side-by-side comparison of last two sessions */}
              {practiceHistory.length >= 2 && (() => {
                const last = practiceHistory[practiceHistory.length - 1];
                const prev = practiceHistory[practiceHistory.length - 2];

                const deltaText = (curr, previous) => {
                  if (curr == null || previous == null) return '–';
                  const diff = curr - previous;
                  if (diff === 0) return `${curr}/10 (no change)`;
                  const sign = diff > 0 ? '+' : '';
                  return `${curr}/10 (${sign}${diff})`;
                };

                return (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">
                      Last Two Sessions Comparison
                    </h3>
                    <div className="p-4 bg-white border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-gray-800 mb-1">Previous Session</p>
                          <p className="text-xs text-gray-500 mb-1">
                            {prev.question || 'Previous question'}
                          </p>
                          <p>Clarity: {prev.clarityScore}/10</p>
                          <p>Structure: {prev.structureScore}/10</p>
                          <p>Professionalism: {prev.professionalismScore}/10</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 mb-1">Most Recent</p>
                          <p className="text-xs text-gray-500 mb-1">
                            {last.question || 'Most recent question'}
                          </p>
                          <p>Clarity: {deltaText(last.clarityScore, prev.clarityScore)}</p>
                          <p>Structure: {deltaText(last.structureScore, prev.structureScore)}</p>
                          <p>
                            Professionalism:{' '}
                            {deltaText(last.professionalismScore, prev.professionalismScore)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 5 — Nerves / Confidence / Storytelling */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Extra Exercises</h3>
                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                  <li>Record yourself answering and watch for filler words (“um,” “like”).</li>
                  <li>Practice speaking slower than feels normal.</li>
                  <li>Rehearse your top 3 stories using STAR.</li>
                  <li>Practice answering with a 3-part structure: Point → Example → Result.</li>
                  <li>Write 3 opening hooks that make you memorable.</li>
                </ul>
              </div>

            </Card.Body>
          </Card>
        );

      case 'practiceTools':
        return (
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Icon name="sparkles" size="sm" />
                Practice Tools & Nerves Management
              </Card.Title>
            </Card.Header>
            <Card.Body className="space-y-6">
              {/* Confidence warm-up exercises */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Confidence Warm-Up</h3>
                <p className="text-sm text-gray-600">
                  Use these quick prompts before you start a timed practice or real interview.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      3 strengths I want to highlight
                    </label>
                    <textarea
                      className="w-full border rounded p-2 h-24"
                      value={warmupNotes.strengths}
                      onChange={(e) =>
                        setWarmupNotes((prev) => ({ ...prev, strengths: e.target.value }))
                      }
                      placeholder="- Problem solving\n- Communication\n- Ownership"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      2 recent wins I&apos;m proud of
                    </label>
                    <textarea
                      className="w-full border rounded p-2 h-24"
                      value={warmupNotes.wins}
                      onChange={(e) =>
                        setWarmupNotes((prev) => ({ ...prev, wins: e.target.value }))
                      }
                      placeholder="- Shipped X feature\n- Nailed Y project"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      1 story I definitely want to use
                    </label>
                    <textarea
                      className="w-full border rounded p-2 h-24"
                      value={warmupNotes.story}
                      onChange={(e) =>
                        setWarmupNotes((prev) => ({ ...prev, story: e.target.value }))
                      }
                      placeholder="Brief outline of a strong STAR story"
                    />
                  </div>
                </div>
              </div>

              {/* Nerves / grounding checklist */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Grounding Checklist</h3>
                <p className="text-sm text-gray-600">
                  Check these off right before your interview to calm nerves through preparation.
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    {
                      id: 'breathing',
                      label: 'Did 60 seconds of slow breathing (inhale 4, hold 4, exhale 6).',
                    },
                    {
                      id: 'visualize',
                      label:
                        'Visualized the interview going well and myself answering calmly.',
                    },
                    {
                      id: 'cheatSheet',
                      label:
                        'Prepared a one-page “cheat sheet” of key stories, metrics, and questions.',
                    },
                    {
                      id: 'notesSkim',
                      label:
                        'Skimmed key notes instead of trying to re-study everything last minute.',
                    },
                    {
                      id: 'kindSelfTalk',
                      label:
                        'Said one kind, realistic sentence to myself about my skills and effort.',
                    },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={!!nervesChecklist[item.id]}
                        onChange={() => toggleNervesItem(item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mini scripts for if you blank or stumble */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">If I Blank, I Can Say…</h3>
                <p className="text-sm text-gray-600">
                  Having a “backup script” ready makes it easier to recover smoothly.
                </p>
                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                  <li>
                    “That&apos;s a great question—let me take a second to organize my thoughts.”
                  </li>
                  <li>
                    “I actually had a similar situation recently. Let me walk you through that
                    example.”
                  </li>
                  <li>
                    “I haven&apos;t done exactly that, but here&apos;s how I would approach it based
                    on similar work I&apos;ve done.”
                  </li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        );

        case 'followup':
          return (
            <div className="space-y-6">
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Icon name="mail" size="sm" />
                    Interview Follow-Up Templates
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate personalized follow-up emails for your interviews and log them for tracking.
                  </p>

                  {/* Input form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company *
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g., Pfizer, BNY Mellon"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role (optional)
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Software Engineer Intern"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interviewer Name (optional)
                      </label>
                      <input
                        type="text"
                        value={interviewerName}
                        onChange={(e) => setInterviewerName(e.target.value)}
                        placeholder="e.g., Sarah, Blake"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date (optional)
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Outcome (to tailor templates)
                      </label>
                      <select
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Process still ongoing</option>
                        <option value="no_response">No response yet</option>
                        <option value="rejected">Rejected</option>
                        <option value="offer">Offer received</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Topics Discussed (optional)
                      </label>
                      <textarea
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        placeholder="e.g., ML system design, team culture, impact of your dashboard..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You can list one per line; they will be woven into the thank-you template.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateFollowUps}
                    disabled={followUpLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {followUpLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon name="sparkles" size="sm" />
                        Generate Templates
                      </>
                    )}
                  </button>

                  {followUpError && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                      {followUpError}
                    </div>
                  )}

                  {followUpSuccess && (
                    <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm">
                      {followUpSuccess}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Templates List */}
              {followUpTemplates && (
                <div className="space-y-4">
                  {/* Thank You */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Thank-You Email</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-xs text-gray-500 mb-2">
                        Suggested timing: within 24 hours of the interview.
                      </p>
                      <p className="text-sm font-semibold mb-1">
                        Subject: {followUpTemplates.thankYou.subject}
                      </p>
                      <textarea
                        readOnly
                        value={followUpTemplates.thankYou.body}
                        className="w-full border border-gray-300 rounded-md p-3 text-sm font-mono whitespace-pre-wrap"
                        rows={6}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `Subject: ${followUpTemplates.thankYou.subject}\n\n${followUpTemplates.thankYou.body}`
                            )
                          }
                          className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Copy to Clipboard
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLogFollowUpSent('thank_you')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Mark as Sent & Track
                        </button>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Status Inquiry */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Status Inquiry Email</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-xs text-gray-500 mb-2">
                        Suggested timing: ~5 days after last interview if no response.
                      </p>
                      <p className="text-sm font-semibold mb-1">
                        Subject: {followUpTemplates.statusInquiry.subject}
                      </p>
                      <textarea
                        readOnly
                        value={followUpTemplates.statusInquiry.body}
                        className="w-full border border-gray-300 rounded-md p-3 text-sm font-mono whitespace-pre-wrap"
                        rows={6}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `Subject: ${followUpTemplates.statusInquiry.subject}\n\n${followUpTemplates.statusInquiry.body}`
                            )
                          }
                          className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Copy to Clipboard
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLogFollowUpSent('status_inquiry')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Mark as Sent & Track
                        </button>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Feedback Request */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Feedback Request Email</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-xs text-gray-500 mb-2">
                        Suggested timing: a few days after a decision is communicated.
                      </p>
                      <p className="text-sm font-semibold mb-1">
                        Subject: {followUpTemplates.feedbackRequest.subject}
                      </p>
                      <textarea
                        readOnly
                        value={followUpTemplates.feedbackRequest.body}
                        className="w-full border border-gray-300 rounded-md p-3 text-sm font-mono whitespace-pre-wrap"
                        rows={6}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `Subject: ${followUpTemplates.feedbackRequest.subject}\n\n${followUpTemplates.feedbackRequest.body}`
                            )
                          }
                          className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Copy to Clipboard
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleLogFollowUpSent('feedback_request')
                          }
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Mark as Sent & Track
                        </button>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Networking follow-up (especially useful on rejection) */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Networking Follow-Up Email</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-xs text-gray-500 mb-2">
                        Suggested timing: shortly after learning you were not selected.
                      </p>
                      <p className="text-sm font-semibold mb-1">
                        Subject: {followUpTemplates.networkingFollowUp.subject}
                      </p>
                      <textarea
                        readOnly
                        value={followUpTemplates.networkingFollowUp.body}
                        className="w-full border border-gray-300 rounded-md p-3 text-sm font-mono whitespace-pre-wrap"
                        rows={6}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `Subject: ${followUpTemplates.networkingFollowUp.subject}\n\n${followUpTemplates.networkingFollowUp.body}`
                            )
                          }
                          className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Copy to Clipboard
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLogFollowUpSent('networking')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Mark as Sent & Track
                        </button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </div>
          );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Insights & Preparation</h1>
        <p className="text-gray-600">Get comprehensive interview information for your target company and role</p>
      </div>

      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Microsoft, Google, Amazon"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role (Optional)
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Software Engineer, Product Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Icon name="search" size="sm" />
                  Get Insights
                </>
              )}
            </button>
          </div>
        </Card.Body>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {insights && (
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

          <TabContent />
        </div>
      )}
    </div>
  );
};

export default InterviewInsights;