import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import referralsAPI from '../../api/referrals';
import { contactsAPI } from '../../api/networking';

const ReferralRequestModal = ({ referral, jobs, onClose }) => {
  const [formData, setFormData] = useState({
    jobId: '',
    contactId: '',
    requestTemplate: '',
    status: 'pending',
    sentDate: '',
    followUpDate: '',
    responseDate: '',
    responseType: '',
    notes: '',
  });
  const [contacts, setContacts] = useState([]);
  const [suggestedContacts, setSuggestedContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchContacts();
    if (referral) {
      setFormData({
        jobId: referral.job_id || '',
        contactId: referral.contact_id || '',
        requestTemplate: referral.request_template || '',
        status: referral.status || 'pending',
        sentDate: referral.sent_date ? referral.sent_date.split('T')[0] : '',
        followUpDate: referral.follow_up_date ? referral.follow_up_date.split('T')[0] : '',
        responseDate: referral.response_date ? referral.response_date.split('T')[0] : '',
        responseType: referral.response_type || '',
        notes: referral.notes || '',
      });
    }
  }, [referral]);

  // Update suggested contacts when job changes
  useEffect(() => {
    if (formData.jobId && contacts.length > 0) {
      const selectedJob = jobs.find(j => j.id === formData.jobId);
      if (selectedJob) {
        const ranked = rankContactsByRelevance(contacts, selectedJob);
        setSuggestedContacts(ranked);
        
        // Auto-select the best match if no contact is selected
        if (!formData.contactId && ranked.length > 0 && ranked[0].matchScore > 0) {
          setFormData(prev => ({ ...prev, contactId: ranked[0].id }));
        }
      }
    } else {
      setSuggestedContacts([]);
    }
  }, [formData.jobId, contacts, jobs]);

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  /**
   * Rank contacts by relevance to the job
   * Scoring:
   * - Company match: 100 points (HIGH priority)
   * - Industry match: 30 points
   * - Similar role: 20 points
   */
  const rankContactsByRelevance = (contactsList, job) => {
    return contactsList.map(contact => {
      let score = 0;
      const matchReasons = [];

      // Company match (highest priority) - use substring matching
      if (contact.company && job.company) {
        const contactCompanyLower = contact.company.toLowerCase().trim();
        const jobCompanyLower = job.company.toLowerCase().trim();
        
        // Check if either company name contains the other (substring match)
        if (contactCompanyLower.includes(jobCompanyLower) || 
            jobCompanyLower.includes(contactCompanyLower)) {
          score += 100;
          matchReasons.push('Works at target company');
        }
      }

      // Industry match
      if (contact.industry && job.industry) {
        const contactIndustryLower = contact.industry.toLowerCase().trim();
        const jobIndustryLower = job.industry.toLowerCase().trim();
        
        if (contactIndustryLower.includes(jobIndustryLower) || 
            jobIndustryLower.includes(contactIndustryLower)) {
          score += 30;
          matchReasons.push('Same industry');
        }
      }

      // Role similarity (basic keyword matching)
      if (contact.role && job.title) {
        const contactRoleLower = contact.role.toLowerCase();
        const jobTitleLower = job.title.toLowerCase();
        
        // Check for common role keywords
        const roleKeywords = ['engineer', 'developer', 'manager', 'designer', 'analyst', 'director', 'lead', 'senior', 'junior', 'administrator', 'developer', 'intern'];
        const matchedKeywords = roleKeywords.filter(keyword => 
          contactRoleLower.includes(keyword) && jobTitleLower.includes(keyword)
        );
        
        if (matchedKeywords.length > 0) {
          score += 20;
          matchReasons.push('Similar role');
        }
      }

      return {
        ...contact,
        matchScore: score,
        matchReasons,
      };
    })
    .filter(contact => contact.matchScore > 0) // Only show contacts with some relevance
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by highest score first
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateTemplate = async () => {
    if (!formData.jobId || !formData.contactId) {
      alert('Please select both a job and a contact first');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const result = await referralsAPI.generateTemplate({
        jobId: formData.jobId,
        contactId: formData.contactId,
      });
      setFormData(prev => ({
        ...prev,
        requestTemplate: result.template,
      }));
    } catch (err) {
      console.error('Error generating template:', err);
      setError(err.response?.data?.message || 'Failed to generate template');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        jobId: formData.jobId,
        contactId: formData.contactId,
        requestTemplate: formData.requestTemplate,
        notes: formData.notes || undefined,
      };

      if (referral) {
        // Update existing referral
        const updatePayload = {
          status: formData.status,
          requestTemplate: formData.requestTemplate,
          sentDate: formData.sentDate || undefined,
          followUpDate: formData.followUpDate || undefined,
          responseDate: formData.responseDate || undefined,
          responseType: formData.responseType || undefined,
          notes: formData.notes || undefined,
        };
        await referralsAPI.updateReferral(referral.id, updatePayload);
      } else {
        // Create new referral
        await referralsAPI.createReferral(payload);
      }

      onClose(true); // true indicates refresh needed
    } catch (err) {
      console.error('Error saving referral:', err);
      setError(err.response?.data?.message || 'Failed to save referral request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {referral ? 'Edit Referral Request' : 'New Referral Request'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Job Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Application <span className="text-red-500">*</span>
            </label>
            <select
              name="jobId"
              value={formData.jobId}
              onChange={handleChange}
              required
              disabled={!!referral}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a job</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} at {job.company} - {job.status}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact <span className="text-red-500">*</span>
            </label>
            
            {/* Suggested Contacts */}
            {suggestedContacts.length > 0 && !referral && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  🎯 Suggested Contacts for This Job:
                </div>
                <div className="space-y-2">
                  {suggestedContacts.slice(0, 3).map(contact => (
                    <div 
                      key={contact.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        formData.contactId === contact.id 
                          ? 'bg-blue-200 border border-blue-400' 
                          : 'bg-white border border-blue-100 hover:bg-blue-100'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, contactId: contact.id }))}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{contact.full_name}</div>
                          <div className="text-sm text-gray-600">
                            {contact.role || 'Contact'} 
                            {contact.company && ` at ${contact.company}`}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {contact.matchReasons.map((reason, idx) => (
                              <span key={idx} className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                        {contact.matchScore >= 100 && (
                          <span className="ml-2 px-2 py-1 text-xs font-bold bg-green-600 text-white rounded">
                            BEST MATCH
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {contacts.length > suggestedContacts.length && (
                  <div className="text-xs text-gray-500 mt-2">
                    {contacts.length - suggestedContacts.length} other contact(s) available in dropdown
                  </div>
                )}
              </div>
            )}
            
            <select
              name="contactId"
              value={formData.contactId}
              onChange={handleChange}
              required
              disabled={!!referral}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a contact</option>
              {suggestedContacts.length > 0 && (
                <optgroup label="🎯 Suggested Contacts">
                  {suggestedContacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name} - {contact.role || 'Contact'} 
                      {contact.company && ` at ${contact.company}`}
                      {contact.matchScore >= 100 ? ' ⭐ BEST MATCH' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {suggestedContacts.length > 0 && contacts.length > suggestedContacts.length && (
                <optgroup label="Other Contacts">
                  {contacts
                    .filter(c => !suggestedContacts.find(s => s.id === c.id))
                    .map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.full_name} - {contact.role || 'Contact'} 
                        {contact.company && ` at ${contact.company}`}
                      </option>
                    ))}
                </optgroup>
              )}
              {suggestedContacts.length === 0 && contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.full_name} - {contact.role || 'Contact'} 
                  {contact.company && ` at ${contact.company}`}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Template Button */}
          <div>
            <button
              type="button"
              onClick={handleGenerateTemplate}
              disabled={generating || !formData.jobId || !formData.contactId}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {generating ? 'Generating...' : 'Generate Template'}
            </button>
            <p className="text-sm text-gray-500 mt-1">
              AI will generate a personalized referral request based on the job and contact details
            </p>
          </div>

          {/* Request Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Request Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="requestTemplate"
              value={formData.requestTemplate}
              onChange={handleChange}
              required
              rows={8}
              placeholder="Enter your referral request message or generate one using the button above"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status (only for editing) */}
          {referral && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="responded">Responded</option>
              </select>
            </div>
          )}

          {/* Dates (only for editing) */}
          {referral && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sent Date
                </label>
                <input
                  type="date"
                  name="sentDate"
                  value={formData.sentDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Date
                </label>
                <input
                  type="date"
                  name="responseDate"
                  value={formData.responseDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Response Type (only for editing when responded) */}
          {referral && formData.status === 'responded' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Type <span className="text-red-500">*</span>
              </label>
              <select
                name="responseType"
                value={formData.responseType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select response type</option>
                <option value="accepted">Accepted ✅ (Counts toward success rate)</option>
                <option value="declined">Declined ❌</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Required to calculate success rate. "Accepted" means they agreed to refer you.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any additional notes or context"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              {loading ? 'Saving...' : referral ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReferralRequestModal;
