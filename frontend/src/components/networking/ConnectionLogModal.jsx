import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { networkingEventsAPI } from '../../api/networking-events';
import { contactsAPI } from '../../api/networking';

const ConnectionLogModal = ({ event, onClose, onRefresh }) => {
  const [contacts, setContacts] = useState([]);
  const [existingConnections, setExistingConnections] = useState([]);
  const [formData, setFormData] = useState({
    contactId: '',
    followUpNeeded: false,
    followUpDue: '',
    notes: '',
  });
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactData, setNewContactData] = useState({
    fullName: '',
    email: '',
    company: '',
    role: '',
    industry: '',
    relationshipType: 'professional',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContacts();
    if (event.event_connections) {
      setExistingConnections(event.event_connections);
    }
  }, [event]);

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNewContactChange = (e) => {
    const { name, value } = e.target;
    setNewContactData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateNewContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contactPayload = {
        fullName: newContactData.fullName,
        email: newContactData.email || undefined,
        company: newContactData.company || undefined,
        role: newContactData.role || undefined,
        industry: newContactData.industry || undefined,
        relationshipType: newContactData.relationshipType,
      };

      const response = await contactsAPI.create(contactPayload);
      const newContact = response.data;

      // Add to contacts list
      setContacts([...contacts, newContact]);

      // Auto-select the new contact
      setFormData(prev => ({ ...prev, contactId: newContact.id }));

      // Reset new contact form
      setNewContactData({
        fullName: '',
        email: '',
        company: '',
        role: '',
        industry: '',
        relationshipType: 'professional',
      });
      setShowNewContactForm(false);
    } catch (err) {
      console.error('Error creating contact:', err);
      setError(err.response?.data?.message || 'Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        eventId: event.id,
        contactId: formData.contactId,
        followUpNeeded: formData.followUpNeeded,
        followUpDue: formData.followUpDue || undefined,
        notes: formData.notes || undefined,
      };

      const response = await networkingEventsAPI.createConnection(payload);
      setExistingConnections([...existingConnections, response.data]);
      
      // Reset form
      setFormData({
        contactId: '',
        followUpNeeded: false,
        followUpDue: '',
        notes: '',
      });
      
      // Trigger refresh of parent to update stats
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error adding connection:', err);
      setError(err.response?.data?.message || 'Failed to add connection');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (connectionId) => {
    if (!confirm('Remove this connection from the event?')) return;

    try {
      await networkingEventsAPI.deleteConnection(connectionId);
      setExistingConnections(existingConnections.filter(c => c.id !== connectionId));
      
      // Trigger refresh of parent to update stats
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting connection:', err);
    }
  };

  const handleUpdateFollowUp = async (connectionId, followUpNeeded, followUpDue) => {
    try {
      await networkingEventsAPI.updateConnection(connectionId, {
        followUpNeeded,
        followUpDue: followUpDue || undefined,
      });
      
      // Update local state
      setExistingConnections(existingConnections.map(c =>
        c.id === connectionId
          ? { ...c, follow_up_needed: followUpNeeded, follow_up_due: followUpDue }
          : c
      ));
      
      // Trigger refresh of parent to update stats without closing modal
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error updating follow-up:', err);
    }
  };

  const handleMarkFollowUpComplete = async (connectionId) => {
    await handleUpdateFollowUp(connectionId, false, null);
  };

  // Filter out already connected contacts
  const connectedContactIds = existingConnections.map(c => c.contact_id);
  const availableContacts = contacts.filter(c => !connectedContactIds.includes(c.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Connections</h2>
            <p className="text-sm text-gray-600 mt-1">{event.event_name}</p>
          </div>
          <button
            onClick={() => onClose(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Add New Connection Form */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Log New Connection</h3>
            <form onSubmit={handleAddConnection} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Contact <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewContactForm(!showNewContactForm)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showNewContactForm ? 'Cancel' : '+ Add New Contact'}
                  </button>
                </div>
                
                {showNewContactForm ? (
                  <div className="bg-white border border-gray-300 rounded-md p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={newContactData.fullName}
                          onChange={handleNewContactChange}
                          required
                          placeholder="John Doe"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={newContactData.email}
                          onChange={handleNewContactChange}
                          placeholder="john@example.com"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={newContactData.company}
                          onChange={handleNewContactChange}
                          placeholder="Acme Inc"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Role/Title
                        </label>
                        <input
                          type="text"
                          name="role"
                          value={newContactData.role}
                          onChange={handleNewContactChange}
                          placeholder="Software Engineer"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Industry
                        </label>
                        <input
                          type="text"
                          name="industry"
                          value={newContactData.industry}
                          onChange={handleNewContactChange}
                          placeholder="Technology"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Relationship Type
                        </label>
                        <select
                          name="relationshipType"
                          value={newContactData.relationshipType}
                          onChange={handleNewContactChange}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="professional">Professional</option>
                          <option value="mentor">Mentor</option>
                          <option value="peer">Peer</option>
                          <option value="recruiter">Recruiter</option>
                          <option value="referral">Referral</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNewContact}
                      disabled={loading || !newContactData.fullName}
                      className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Contact & Select'}
                    </button>
                  </div>
                ) : (
                  <select
                    name="contactId"
                    value={formData.contactId}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a contact...</option>
                    {availableContacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.full_name}
                        {contact.company && ` - ${contact.company}`}
                        {contact.role && ` (${contact.role})`}
                      </option>
                    ))}
                  </select>
                )}
                
                {!showNewContactForm && availableContacts.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    All contacts have been logged. Click "+ Add New Contact" to create one.
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="followUpNeeded"
                  checked={formData.followUpNeeded}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Follow-up needed
                </label>
              </div>

              {formData.followUpNeeded && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Due Date
                  </label>
                  <input
                    type="date"
                    name="followUpDue"
                    value={formData.followUpDue}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Context of meeting, topics discussed, next steps..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || (!formData.contactId && !showNewContactForm)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {loading ? 'Adding...' : 'Add Connection'}
              </button>
            </form>
          </div>

          {/* Existing Connections List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Connections Made ({existingConnections.length})
            </h3>
            {existingConnections.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No connections logged yet. Add your first connection above!
              </p>
            ) : (
              <div className="space-y-4">
                {existingConnections.map(connection => (
                  <div
                    key={connection.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {connection.professional_contacts?.full_name}
                        </h4>
                        {connection.professional_contacts?.role && (
                          <p className="text-sm text-gray-600">
                            {connection.professional_contacts.role}
                            {connection.professional_contacts.company &&
                              ` at ${connection.professional_contacts.company}`}
                          </p>
                        )}
                        {connection.notes && (
                          <p className="text-sm text-gray-600 mt-2">{connection.notes}</p>
                        )}
                        {connection.follow_up_needed && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Follow-up needed
                              {connection.follow_up_due &&
                                ` by ${new Date(connection.follow_up_due).toLocaleDateString()}`}
                            </span>
                            <button
                              onClick={() => handleMarkFollowUpComplete(connection.id)}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              title="Mark follow-up as complete"
                            >
                              Mark Complete
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove connection"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionLogModal;
