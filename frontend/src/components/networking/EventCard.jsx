import React from 'react';
import { CalendarIcon, MapPinIcon, UsersIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const EventCard = ({ event, onEdit, onDelete, onAddConnections }) => {
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const isPastEvent = eventDate && eventDate < new Date();
  const connectionsCount = event.event_connections?.length || 0;
  const pendingFollowUps = event.event_connections?.filter(c => c.follow_up_needed)?.length || 0;

  const formatDate = (date) => {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{event.event_name}</h3>
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>{formatDate(event.event_date)}</span>
            {isPastEvent && (
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                Past
              </span>
            )}
            {!isPastEvent && eventDate && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                Upcoming
              </span>
            )}
          </div>
          {event.location && (
            <div className="flex items-center text-gray-600 text-sm">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(event)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit event"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete event"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Goals */}
      {event.goals && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Goals:</h4>
          <p className="text-sm text-gray-600">{event.goals}</p>
        </div>
      )}

      {/* Notes */}
      {event.notes && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes:</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{event.notes}</p>
        </div>
      )}

      {/* Connections Summary */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm">
            <UsersIcon className="h-5 w-5 text-purple-600 mr-2" />
            <span className="font-semibold">{connectionsCount} Connections</span>
            {pendingFollowUps > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                {pendingFollowUps} follow-up{pendingFollowUps !== 1 ? 's' : ''} needed
              </span>
            )}
          </div>
          <button
            onClick={() => onAddConnections(event)}
            className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Log Connection
          </button>
        </div>

        {/* Connection List Preview */}
        {connectionsCount > 0 && (
          <div className="space-y-1">
            {event.event_connections.slice(0, 3).map(connection => (
              <div key={connection.id} className="text-sm text-gray-600 flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                <span className="font-medium">{connection.professional_contacts?.full_name}</span>
                {connection.professional_contacts?.company && (
                  <span className="text-gray-500 ml-1">
                    at {connection.professional_contacts.company}
                  </span>
                )}
              </div>
            ))}
            {connectionsCount > 3 && (
              <div className="text-sm text-gray-500 mt-1">
                + {connectionsCount - 3} more connection{connectionsCount - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
