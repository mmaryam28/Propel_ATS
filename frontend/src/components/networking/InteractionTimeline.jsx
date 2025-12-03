import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function InteractionTimeline({ interactions, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInteractionIcon = (type) => {
    const iconClass = 'h-8 w-8 rounded-full flex items-center justify-center';
    
    switch (type) {
      case 'email':
        return <div className={`${iconClass} bg-blue-100 text-blue-600`}>📧</div>;
      case 'phone_call':
        return <div className={`${iconClass} bg-green-100 text-green-600`}>📞</div>;
      case 'meeting':
        return <div className={`${iconClass} bg-purple-100 text-purple-600`}>👥</div>;
      case 'coffee_chat':
        return <div className={`${iconClass} bg-yellow-100 text-yellow-600`}>☕</div>;
      case 'linkedin_message':
        return <div className={`${iconClass} bg-blue-100 text-blue-600`}>💼</div>;
      case 'referral_request':
        return <div className={`${iconClass} bg-orange-100 text-orange-600`}>🤝</div>;
      case 'follow_up':
        return <div className={`${iconClass} bg-indigo-100 text-indigo-600`}>🔄</div>;
      case 'informational_interview':
        return <div className={`${iconClass} bg-pink-100 text-pink-600`}>🎤</div>;
      default:
        return <div className={`${iconClass} bg-gray-100 text-gray-600`}>📝</div>;
    }
  };

  const getStrengthColor = (strength) => {
    if (strength >= 75) return 'text-green-600';
    if (strength >= 50) return 'text-yellow-600';
    if (strength >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {interactions.map((interaction, idx) => (
          <li key={interaction.id}>
            <div className="relative pb-8">
              {idx !== interactions.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>{getInteractionIcon(interaction.interaction_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {interaction.interaction_type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(interaction.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {interaction.relationship_strength && (
                        <span
                          className={`text-sm font-medium ${getStrengthColor(
                            interaction.relationship_strength
                          )}`}
                        >
                          {interaction.relationship_strength}%
                        </span>
                      )}
                      <button
                        onClick={() => onEdit(interaction)}
                        className="text-gray-400 hover:text-primary-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(interaction.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {interaction.summary && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {interaction.summary}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
