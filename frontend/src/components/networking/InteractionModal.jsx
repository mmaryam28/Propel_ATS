import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { contactsAPI } from '../../api/networking';

export default function InteractionModal({ contactId, interaction, onClose }) {
  const [formData, setFormData] = useState({
    contactId: contactId,
    interactionType: '',
    summary: '',
    date: new Date().toISOString().split('T')[0],
    relationshipStrength: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (interaction) {
      setFormData({
        contactId: interaction.contact_id,
        interactionType: interaction.interaction_type || '',
        summary: interaction.summary || '',
        date: interaction.date ? new Date(interaction.date).toISOString().split('T')[0] : '',
        relationshipStrength: interaction.relationship_strength || 50,
      });
    }
  }, [interaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert relationshipStrength to number
    const processedValue = name === 'relationshipStrength' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure relationshipStrength is a number
      const payload = {
        ...formData,
        relationshipStrength: Number(formData.relationshipStrength),
      };
      
      if (interaction) {
        await contactsAPI.updateInteraction(interaction.id, payload);
      } else {
        await contactsAPI.createInteraction(payload);
      }
      onClose();
    } catch (err) {
      console.error('Error saving interaction:', err);
      setError('Failed to save interaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {interaction ? 'Edit Interaction' : 'Add New Interaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interaction Type <span className="text-red-500">*</span>
            </label>
            <select
              name="interactionType"
              value={formData.interactionType}
              onChange={handleChange}
              required
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select type...</option>
              <option value="email">Email</option>
              <option value="phone_call">Phone Call</option>
              <option value="meeting">Meeting</option>
              <option value="coffee_chat">Coffee Chat</option>
              <option value="linkedin_message">LinkedIn Message</option>
              <option value="referral_request">Referral Request</option>
              <option value="follow_up">Follow Up</option>
              <option value="informational_interview">Informational Interview</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the interaction..."
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship Strength: {formData.relationshipStrength}%
            </label>
            <input
              type="range"
              name="relationshipStrength"
              value={formData.relationshipStrength}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Weak</span>
              <span>Moderate</span>
              <span>Strong</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : interaction ? 'Update' : 'Add Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
