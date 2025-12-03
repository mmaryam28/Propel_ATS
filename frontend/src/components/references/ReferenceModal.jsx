import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { referencesAPI } from '../../api/references';
import { contactsAPI } from '../../api/networking';

export default function ReferenceModal({ reference, onClose }) {
  const [formData, setFormData] = useState({
    contactId: '',
    referenceType: 'professional',
    email: '',
    phone: '',
    notes: '',
  });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContacts();
    if (reference) {
      setFormData({
        contactId: reference.contact_id || '',
        referenceType: reference.reference_type || 'professional',
        email: reference.email || '',
        phone: reference.phone || '',
        notes: reference.notes || '',
      });
    }
  }, [reference]);

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (reference) {
        await referencesAPI.updateReference(reference.id, {
          referenceType: formData.referenceType,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
        });
      } else {
        await referencesAPI.createReference(formData);
      }
      onClose(true);
    } catch (err) {
      console.error('Error saving reference:', err);
      setError(err.response?.data?.message || 'Failed to save reference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {reference ? 'Edit Reference' : 'Add Reference'}
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
              disabled={!!reference}
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
            {!reference && (
              <p className="text-sm text-gray-500 mt-1">
                Don't see your contact? Add them in the <a href="/networking/contacts" className="text-blue-600 hover:underline">Contacts</a> section first.
              </p>
            )}
          </div>

          {/* Reference Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Type
            </label>
            <select
              name="referenceType"
              value={formData.referenceType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="professional">Professional</option>
              <option value="manager">Manager</option>
              <option value="colleague">Colleague</option>
              <option value="mentor">Mentor</option>
              <option value="academic">Academic</option>
              <option value="character">Character</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="reference@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Contact info for reaching out directly (optional)
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any notes about this reference, their strengths, or context..."
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
              {loading ? 'Saving...' : reference ? 'Update Reference' : 'Add Reference'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
