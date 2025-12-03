import React, { useEffect, useState } from 'react';
import { informationalInterviewsAPI } from '../../api/networking-events';
import { CheckCircleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const InterviewPrepFramework = ({ contact, framework: initialFramework }) => {
  const [framework, setFramework] = useState(initialFramework);
  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (initialFramework) {
      setFramework(initialFramework);
    } else if (contact) {
      // Generate framework dynamically
      const generated = generateFrameworkFromContact(contact);
      setFramework(generated);
    }
  }, [contact, initialFramework]);

  const generateFrameworkFromContact = (contactInfo) => {
    return {
      researchChecklist: [
        `Research ${contactInfo.company || 'the company'}'s recent news and developments`,
        `Review ${contactInfo.full_name}'s LinkedIn profile and career trajectory`,
        `Understand current trends in ${contactInfo.industry || 'the industry'}`,
        'Prepare specific questions based on their expertise',
        'Review your own goals and what you hope to learn',
      ],
      questionTemplates: [
        `Can you tell me about your journey to becoming a ${contactInfo.role || 'professional'}?`,
        'What does a typical day look like in your role?',
        `What skills are most important for success in ${contactInfo.industry || 'this field'}?`,
        'What challenges do you face in your current position?',
        'What advice would you give someone looking to enter this field?',
        'Are there any resources (books, courses, podcasts) you\'d recommend?',
        'How do you see the industry evolving in the next few years?',
        'What do you wish you had known when you were starting your career?',
      ],
      agendaOutline: [
        'Introduction (2-3 minutes): Brief background and purpose of the conversation',
        'Their Career Journey (5-7 minutes): Ask about their path and key decisions',
        'Industry Insights (5-7 minutes): Discuss trends, challenges, and opportunities',
        'Skills & Advice (5-7 minutes): Learn about essential skills and recommendations',
        'Next Steps (3-5 minutes): Ask about resources, additional contacts, or follow-up',
        'Closing (2 minutes): Express gratitude and discuss future connection',
      ],
      followUpTemplate: `Hi ${contactInfo.full_name},

Thank you so much for taking the time to speak with me today. I really appreciated your insights on [SPECIFIC TOPIC] and your advice about [SPECIFIC ADVICE].

I've already started looking into [ACTIONABLE ITEM] that you mentioned, and I'm excited to explore it further.

I'll keep you updated on my progress, and I hope we can stay in touch. Please don't hesitate to reach out if there's anything I can help you with.

Thanks again for your time and generosity.

Best regards,
[Your Name]`,
    };
  };

  const handleCheckItem = (section, index) => {
    const key = `${section}-${index}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!framework) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading preparation framework...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Research Checklist */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Research Checklist</h4>
        </div>
        <ul className="space-y-2">
          {framework.researchChecklist?.map((item, index) => (
            <li key={index} className="flex items-start">
              <input
                type="checkbox"
                checked={checkedItems[`research-${index}`] || false}
                onChange={() => handleCheckItem('research', index)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className={`ml-3 text-sm ${checkedItems[`research-${index}`] ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Question Templates */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Question Templates</h4>
        </div>
        <ul className="space-y-2">
          {framework.questionTemplates?.map((question, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full text-xs font-semibold mr-3 mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-gray-700">{question}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Tip: Adapt these questions based on the conversation flow. Listen actively and ask follow-up questions.
        </p>
      </div>

      {/* Agenda Outline */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Agenda Outline (30 minutes)</h4>
        </div>
        <div className="space-y-3">
          {framework.agendaOutline?.map((item, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mr-3">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Template */}
      <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
        <div className="flex items-center mb-3">
          <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Follow-up Email Template</h4>
        </div>
        <div className="bg-white rounded p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
            {framework.followUpTemplate}
          </pre>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(framework.followUpTemplate)}
          className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Copy Template
        </button>
        <p className="text-xs text-gray-600 mt-2">
          Send within 24 hours of the interview. Personalize with specific topics discussed.
        </p>
      </div>

      {/* Best Practices */}
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">Best Practices:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>✓ Be on time (join 2-3 minutes early for virtual meetings)</li>
          <li>✓ Keep the conversation to 20-30 minutes unless they offer more time</li>
          <li>✓ Take notes during the conversation (ask permission first)</li>
          <li>✓ Be genuinely curious and listen more than you talk</li>
          <li>✓ Don't ask for a job - focus on learning and building relationship</li>
          <li>✓ Offer value where you can (share an article, make an introduction)</li>
          <li>✓ Always send a thank you note within 24 hours</li>
        </ul>
      </div>
    </div>
  );
};

export default InterviewPrepFramework;
