import { HeartIcon, ClockIcon, ChatBubbleLeftIcon, BellIcon } from '@heroicons/react/24/outline';

export default function HealthScoreCard({ healthScore, onAddReminder }) {
  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthLabel = (status) => {
    const labels = {
      healthy: { text: 'Healthy', icon: '✓' },
      needs_attention: { text: 'Needs Attention', icon: '⚠' },
      at_risk: { text: 'At Risk', icon: '!' },
    };
    return labels[status] || labels.needs_attention;
  };

  const healthLabel = getHealthLabel(healthScore.status);

  return (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${
      healthScore.status === 'healthy' ? 'border-green-500' :
      healthScore.status === 'needs_attention' ? 'border-yellow-500' :
      'border-red-500'
    }`}>
      <div className="flex items-center justify-between">
        {/* Contact Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{healthScore.fullName}</h3>
          {healthScore.company && (
            <p className="text-sm text-gray-600">{healthScore.role} at {healthScore.company}</p>
          )}
        </div>

        {/* Health Score */}
        <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${getHealthColor(healthScore.healthScore)}`}>
          <div className="flex items-center">
            <HeartIcon className="h-6 w-6 mr-1" />
            <span className="text-2xl font-bold">{healthScore.healthScore}</span>
          </div>
          <span className="text-xs font-medium mt-1">{healthLabel.text}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-500 mb-1">
            <ClockIcon className="h-4 w-4 mr-1" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{healthScore.daysSinceLastContact}</p>
          <p className="text-xs text-gray-500">Days Since Contact</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-500 mb-1">
            <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{healthScore.interactionCount}</p>
          <p className="text-xs text-gray-500">Interactions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-500 mb-1">
            <HeartIcon className="h-4 w-4 mr-1" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{healthScore.avgRelationshipStrength}</p>
          <p className="text-xs text-gray-500">Avg Strength</p>
        </div>
      </div>

      {/* Action Button */}
      {healthScore.status !== 'healthy' && (
        <button
          onClick={onAddReminder}
          className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          <BellIcon className="h-4 w-4 mr-2" />
          Set Reminder to Reconnect
        </button>
      )}
    </div>
  );
}
