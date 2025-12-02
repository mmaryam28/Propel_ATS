import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

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


  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'preparation', label: 'Preparation', icon: 'timeline' },
    { id: 'questions', label: 'Common Questions', icon: 'help' },
    { id: 'formats', label: 'Interview Formats', icon: 'list' },
    { id: 'tips', label: 'Success Tips', icon: 'star' },
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
          </div>
        );

      case 'process':
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
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Interview Formats</Card.Title>
              </Card.Header>
              <Card.Body>
                {insights.formats?.formats?.length > 0 ? (
                  <div className="space-y-4">
                    {insights.formats.formats.map((format, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-900">{format.type}</h4>
                        <p className="text-gray-600 text-sm mt-1">{format.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Duration:</span> {format.duration}
                        </div>
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-800">Tips:</span> {format.tips}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specific format information available.</p>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Interviewer Information</Card.Title>
              </Card.Header>
              <Card.Body>
                {insights.interviewers?.interviewers?.length > 0 ? (
                  <div className="space-y-3">
                    {insights.interviewers.interviewers.map((interviewer, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium">{interviewer.role}</h5>
                        <p className="text-sm text-gray-600">{interviewer.background}</p>
                        <p className="text-xs text-green-700 mt-1">💡 {interviewer.tips}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specific interviewer information available.</p>
                )}
              </Card.Body>
            </Card>
          </div>
        );

      case 'preparation':
        return (
          <Card>
            <Card.Header>
              <Card.Title>Preparation Recommendations</Card.Title>
            </Card.Header>
            <Card.Body>
              {insights.recommendations?.recommendations?.length > 0 ? (
                <div className="space-y-2">
                  {insights.recommendations.recommendations.map((rec, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">{rec}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    `Research ${company}'s mission, values, and recent developments`,
                    `Review the ${role || 'target role'} job description thoroughly`,
                    'Prepare specific examples of past achievements',
                    'Practice explaining technical concepts clearly',
                    'Prepare thoughtful questions about the role and company',
                    'Plan your outfit and route to the interview location',
                    'Bring multiple copies of your resume',
                    'Research the interviewer(s) on LinkedIn if known',
                    'Practice your elevator pitch',
                    'Review your portfolio or work samples'
                  ].map((item, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        );

      case 'tips':
        return (
          <Card>
            <Card.Header>
              <Card.Title>Success Tips from Candidates</Card.Title>
            </Card.Header>
            <Card.Body>
              {insights.successTips?.tips?.length > 0 ? (
                <div className="space-y-3">
                  {insights.successTips.tips.map((tip, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-gray-800">{tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    `Thoroughly research ${company}'s products, services, and company culture`,
                    'Practice the STAR method for behavioral questions',
                    'Prepare specific examples that demonstrate your skills',
                    'Ask thoughtful questions about the role and team',
                    'Show enthusiasm for the company and position',
                    'Be honest about your experience and learning areas',
                    'Follow up with a thank-you email within 24 hours',
                    'Demonstrate how you can add value to their team'
                  ].map((tip, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-gray-800">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
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