import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

const InterviewInsights = () => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'process', label: 'Process & Stages', icon: 'timeline' },
    { id: 'questions', label: 'Common Questions', icon: 'help' },
    { id: 'formats', label: 'Interview Formats', icon: 'list' },
    { id: 'preparation', label: 'Preparation', icon: 'book' },
    { id: 'tips', label: 'Success Tips', icon: 'star' }
  ];

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
            <Card>
              <Card.Header>
                <Card.Title>Interview Process & Stages</Card.Title>
                {insights.process?.source && (
                  <p className="text-sm text-gray-500 mt-1">Source: {insights.process.source}</p>
                )}
              </Card.Header>
              <Card.Body>
                {insights.process?.stages?.length > 0 ? (
                  <div className="space-y-4">
                    {insights.process.source === 'SERP API Search Results' && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Found specific interview process information</strong> for {company} based on real candidate experiences.
                        </p>
                      </div>
                    )}
                    {insights.process.source === 'Default Process' && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Using standard interview process</strong> - specific {company} process information not found. This represents a typical tech company interview flow.
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {insights.process.stages.map((stage, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{stage.stage}</h4>
                            <p className="text-gray-600 text-sm mt-1">{stage.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              <span className="font-medium">Duration:</span> {stage.duration}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-medium text-yellow-800 mb-2">Preparation Tips</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Research each stage thoroughly and prepare accordingly</li>
                        <li>• Ask your recruiter about the specific format and expectations</li>
                        <li>• Practice technical skills if coding interviews are involved</li>
                        <li>• Prepare behavioral examples using the STAR method</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No specific process information available.</p>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Timeline Information</Card.Title>
                {insights.timeline?.source && (
                  <p className="text-sm text-gray-500 mt-1">Source: {insights.timeline.source}</p>
                )}
              </Card.Header>
              <Card.Body>
                {insights.timeline?.timeline ? (
                  <div className="space-y-4">
                    {insights.timeline.source === 'SERP API Search Results' && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Found specific timeline information</strong> for {company} from candidate experiences.
                        </p>
                      </div>
                    )}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900">Expected Total Duration</h3>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{insights.timeline.timeline.estimated_duration}</p>
                      <p className="text-sm text-blue-600 mt-1">From application to final decision</p>
                    </div>
                    {insights.timeline.timeline.stages?.map((stage, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                        <h4 className="font-medium text-gray-900">{stage.stage}</h4>
                        <p className="text-sm text-gray-600">{stage.duration}</p>
                      </div>
                    ))}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        <strong>Note:</strong> Timeline can vary based on role level, team availability, and current hiring demand.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-orange-800">
                      <strong>Timeline information not available.</strong> Contact the recruiter for specific timeline expectations.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
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