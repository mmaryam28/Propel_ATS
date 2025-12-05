import { format } from 'date-fns';
import { CheckIcon, ClockIcon, TrashIcon, BellIcon } from '@heroicons/react/24/outline';

export default function ReminderCard({ reminder, onComplete, onSnooze, onDelete }) {
  const getReminderTypeLabel = (type) => {
    const types = {
      follow_up: { label: 'Follow Up', color: 'blue' },
      check_in: { label: 'Check In', color: 'green' },
      birthday: { label: 'Birthday', color: 'purple' },
      anniversary: { label: 'Anniversary', color: 'pink' },
      reconnect: { label: 'Reconnect', color: 'orange' },
      custom: { label: 'Custom', color: 'gray' },
    };
    return types[type] || types.custom;
  };

  const typeInfo = getReminderTypeLabel(reminder.reminder_type);
  const isOverdue = new Date(reminder.reminder_date) < new Date();

  return (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${
      isOverdue ? 'border-red-500' : 'border-blue-500'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {reminder.professional_contacts?.full_name || 'Unknown Contact'}
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
              {typeInfo.label}
            </span>
          </div>
          {reminder.professional_contacts?.headline && (
            <p className="text-sm text-gray-600">{reminder.professional_contacts.headline}</p>
          )}
          {reminder.professional_contacts?.company && (
            <p className="text-sm text-gray-500">{reminder.professional_contacts.company}</p>
          )}
        </div>
        {isOverdue && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            Overdue
          </span>
        )}
      </div>

      {/* Reminder Date */}
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <BellIcon className="h-4 w-4 mr-2" />
        <span>
          {isOverdue ? 'Was due: ' : 'Due: '}
          {format(new Date(reminder.reminder_date), 'MMM d, yyyy')}
        </span>
      </div>

      {/* Contact Info */}
      {(reminder.professional_contacts?.email || reminder.professional_contacts?.phone) && (
        <div className="bg-gray-50 rounded p-2 mb-3 text-sm">
          {reminder.professional_contacts.email && (
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> {reminder.professional_contacts.email}
            </p>
          )}
          {reminder.professional_contacts.phone && (
            <p className="text-gray-600">
              <span className="font-medium">Phone:</span> {reminder.professional_contacts.phone}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onComplete}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
        >
          <CheckIcon className="h-4 w-4 mr-1" />
          Complete
        </button>
        <button
          onClick={onSnooze}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
        >
          <ClockIcon className="h-4 w-4 mr-1" />
          Snooze 7d
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm font-medium"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
