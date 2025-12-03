import { useState, useEffect } from 'react';
import { relationshipMaintenanceAPI } from '../../api/relationshipMaintenance';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ReminderModal({ contact, contacts, onClose }) {
  const [formData, setFormData] = useState({
    contactId: contact?.id || '',
    reminderDate: '',
    reminderType: 'follow_up',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, reminderDate: dateStr }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.contactId) {
      alert('Please select a contact');
      return;
    }

    try {
      setLoading(true);
      await relationshipMaintenanceAPI.createReminder({
        contactId: formData.contactId,
        reminderDate: new Date(formData.reminderDate).toISOString(),
        reminderType: formData.reminderType,
      });
      onClose();
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const reminderTypes = [
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'check_in', label: 'Check In' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'reconnect', label: 'Reconnect' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create Reminder</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Contact Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact *
              </label>
              <select
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!!contact}
              >
                <option value="">Select a contact</option>
                {contacts?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.company ? `- ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Type *
              </label>
              <select
                value={formData.reminderType}
                onChange={(e) => setFormData({ ...formData, reminderType: e.target.value })}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {reminderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Date *
              </label>
              <input
                type="date"
                value={formData.reminderDate}
                onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Quick Date Buttons */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 1);
                  setFormData({ ...formData, reminderDate: date.toISOString().split('T')[0] });
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 7);
                  setFormData({ ...formData, reminderDate: date.toISOString().split('T')[0] });
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                1 Week
              </button>
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 30);
                  setFormData({ ...formData, reminderDate: date.toISOString().split('T')[0] });
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                1 Month
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Reminder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
