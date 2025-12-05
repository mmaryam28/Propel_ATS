import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { informationalInterviewsAPI } from '../../api/networking-events';
import { contactsAPI } from '../../api/networking';
import InterviewPrepFramework from './InterviewPrepFramework';

const InformationalInterviewModal = ({ interview, onClose }) => {
  const [formData, setFormData] = useState({
    contactId: '',
    requestStatus: 'requested',
    scheduledTime: '',
    prepNotes: '',
    outcomeNotes: '',
  });
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [outreachMessage, setOutreachMessage] = useState('');
  const [prepFramework, setPrepFramework] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details, outreach, prep, outcome

  useEffect(() => {
    fetchContacts();
    if (interview) {
      setFormData({
        contactId: interview.contact_id || '',
        requestStatus: interview.request_status || 'requested',
        scheduledTime: interview.scheduled_time ? interview.scheduled_time.split('.')[0] : '',
        prepNotes: interview.prep_notes || '',
        outcomeNotes: interview.outcome_notes || '',
      });
      setSelectedContact(interview.professional_contacts);
      // Load prep framework for existing interview
      loadPrepFramework(interview.id);
    }
  }, [interview]);

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const loadPrepFramework = async (interviewId) => {
    try {
      const response = await informationalInterviewsAPI.getPrepFramework(interviewId);
      setPrepFramework(response.data);
    } catch (err) {
      console.error('Error loading prep framework:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update selected contact when contact changes
    if (name === 'contactId') {
      const contact = contacts.find(c => c.id === value);
      setSelectedContact(contact);
      setOutreachMessage(''); // Reset outreach message
    }
  };

  const generateProfessionalTemplate = () => {
    if (!selectedContact) return '';
    
    const contactName = selectedContact.full_name.split(' ')[0];
    const company = selectedContact.company || 'your company';
    const role = selectedContact.role || 'your role';
    
    return `Subject: Request for Informational Interview

Dear ${contactName},

I hope this message finds you well. My name is [Your Name], and I am currently [your current role/status, e.g., "a senior at University pursuing a degree in Computer Science" or "transitioning into the tech industry"].

I came across your profile and was impressed by your experience as ${role} at ${company}. I am particularly interested in learning more about [specific area, e.g., "career paths in software engineering" or "the fintech industry"].

I would greatly appreciate the opportunity to speak with you for 20-30 minutes at your convenience. I would love to learn about:
• Your career journey and how you got to where you are today
• Advice for someone entering/advancing in this field
• Key skills and experiences that have been most valuable in your role
• Any insights about ${company} and the work you do there

I understand you have a busy schedule, and I'm happy to work around your availability. Even a brief conversation would be incredibly valuable to me.

Thank you for considering my request. I look forward to the possibility of learning from your experience.

Best regards,
[Your Name]
[Your Contact Information]`;
  };

  const handleUseTemplate = () => {
    if (!formData.contactId) {
      alert('Please select a contact first');
      return;
    }
    const template = generateProfessionalTemplate();
    setOutreachMessage(template);
    setActiveTab('outreach');
  };

  const handleGenerateOutreach = async () => {
    if (!formData.contactId) {
      alert('Please select a contact first');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const response = await informationalInterviewsAPI.generateOutreach({
        contactId: formData.contactId,
      });
      setOutreachMessage(response.data.message);
      setActiveTab('outreach');
    } catch (err) {
      console.error('Error generating outreach:', err);
      setError(err.response?.data?.message || 'Failed to generate outreach message');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let payload;
      
      if (interview) {
        // Update: don't send contactId
        payload = {
          requestStatus: formData.requestStatus,
          scheduledTime: formData.scheduledTime || undefined,
          prepNotes: formData.prepNotes || undefined,
          outcomeNotes: formData.outcomeNotes || undefined,
        };
        await informationalInterviewsAPI.updateInterview(interview.id, payload);
      } else {
        // Create: include contactId
        payload = {
          contactId: formData.contactId,
          requestStatus: formData.requestStatus,
          scheduledTime: formData.scheduledTime || undefined,
          prepNotes: formData.prepNotes || undefined,
          outcomeNotes: formData.outcomeNotes || undefined,
        };
        await informationalInterviewsAPI.createInterview(payload);
      }

      onClose(true); // true indicates refresh needed
    } catch (err) {
      console.error('Error saving interview:', err);
      setError(err.response?.data?.message || 'Failed to save interview request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {interview ? 'Interview Details' : 'Request Informational Interview'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              1. Details
            </button>
            <button
              onClick={() => setActiveTab('outreach')}
              disabled={!formData.contactId}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'outreach'
                  ? 'border-blue-500 text-blue-600'
                  : !formData.contactId
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              2. Outreach Template
            </button>
            <button
              onClick={() => setActiveTab('prep')}
              disabled={!formData.contactId}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prep'
                  ? 'border-blue-500 text-blue-600'
                  : !formData.contactId
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              3. Preparation
            </button>
            {interview && (
              <button
                onClick={() => setActiveTab('outcome')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'outcome'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                4. Outcome
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Workflow Guide */}
          {!interview && activeTab === 'details' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Workflow Guide:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li><strong>1. Select Contact:</strong> Choose who you want to request an interview with</li>
                <li><strong>2. Get Template:</strong> Use the professional template or generate an AI-personalized message</li>
                <li><strong>3. Prepare:</strong> Review the preparation framework with suggested questions</li>
                <li><strong>4. Track Progress:</strong> Update status as you schedule and complete the interview</li>
              </ol>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              {/* Contact Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact <span className="text-red-500">*</span>
                </label>
                <select
                  name="contactId"
                  value={formData.contactId}
                  onChange={handleChange}
                  required
                  disabled={!!interview}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select a contact</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                      {contact.role && ` - ${contact.role}`}
                      {contact.company && ` at ${contact.company}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Outreach Message Actions */}
              {!interview && formData.contactId && (
                <div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleUseTemplate}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Use Professional Template
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateOutreach}
                      disabled={generating}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      {generating ? 'Generating...' : 'AI Personalized Message'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Use a professional template or let AI personalize it based on the contact's profile
                  </p>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="requestStatus"
                  value={formData.requestStatus}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="requested">Requested</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              {/* Scheduled Time */}
              {(formData.requestStatus === 'scheduled' || formData.requestStatus === 'completed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          )}

          {/* Outreach Tab */}
          {activeTab === 'outreach' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Outreach Message</h3>
              {selectedContact ? (
                <div>
                  {!outreachMessage && (
                    <div className="mb-4 flex gap-3">
                      <button
                        type="button"
                        onClick={handleUseTemplate}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Load Professional Template
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateOutreach}
                        disabled={generating}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                      >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {generating ? 'Generating...' : 'Generate AI Message'}
                      </button>
                    </div>
                  )}
                  <textarea
                    value={outreachMessage}
                    onChange={(e) => setOutreachMessage(e.target.value)}
                    rows={18}
                    placeholder="Click 'Load Professional Template' above to get started, or generate an AI-personalized message..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {outreachMessage && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(outreachMessage)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Copy to Clipboard
                      </button>
                      {selectedContact?.email && (
                        <a
                          href={`mailto:${selectedContact.email}?subject=Request for Informational Interview&body=${encodeURIComponent(outreachMessage)}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Open in Email
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setOutreachMessage('')}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-4">
                    Select a contact in the Details tab first
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Go to Details
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prep Tab */}
          {activeTab === 'prep' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preparation Framework</h3>
              {selectedContact ? (
                <>
                  <InterviewPrepFramework contact={selectedContact} framework={prepFramework} />
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Preparation Notes
                    </label>
                    <textarea
                      name="prepNotes"
                      value={formData.prepNotes}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Add your specific notes, questions you want to ask, research insights..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-600">Select a contact to see preparation framework</p>
              )}
            </div>
          )}

          {/* Outcome Tab */}
          {activeTab === 'outcome' && interview && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Outcome</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome Notes
                </label>
                <textarea
                  name="outcomeNotes"
                  value={formData.outcomeNotes}
                  onChange={handleChange}
                  rows={10}
                  placeholder="Key insights learned, advice received, follow-up actions, contacts recommended..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Things to document:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Key advice and insights shared</li>
                  <li>• Skills or resources recommended</li>
                  <li>• Additional contacts they suggested</li>
                  <li>• Industry trends discussed</li>
                  <li>• Follow-up actions you committed to</li>
                  <li>• Ways you can provide value to them</li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : interview ? 'Update' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InformationalInterviewModal;
