import { UserPlusIcon, BuildingOfficeIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

export default function SuggestedContactCard({ suggestion, onAddReminder }) {
  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'Same Industry':
        return <BriefcaseIcon className="h-5 w-5 text-blue-500" />;
      case 'Alumni Connection':
        return <AcademicCapIcon className="h-5 w-5 text-purple-500" />;
      case 'Met at Event':
        return <UserPlusIcon className="h-5 w-5 text-green-500" />;
      default:
        return <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{suggestion.full_name}</h3>
          {suggestion.headline && (
            <p className="text-sm text-gray-600 mt-1">{suggestion.headline}</p>
          )}
          {suggestion.company && (
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              {suggestion.company}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(suggestion.matchScore)}`}>
          {suggestion.matchScore}% Match
        </div>
      </div>

      {/* Suggestion Reason */}
      <div className="flex items-center text-sm text-gray-600 mb-3">
        {getReasonIcon(suggestion.suggestionReason)}
        <span className="ml-2">{suggestion.suggestionReason}</span>
      </div>

      {/* Connection Path */}
      {suggestion.connectionPath && suggestion.connectionPath.length > 0 && (
        <div className="bg-blue-50 rounded p-3 mb-3">
          <p className="text-xs font-medium text-blue-900 mb-1">Connection Path:</p>
          {suggestion.connectionPath.map((path, index) => (
            <p key={index} className="text-sm text-blue-700">
              {path}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {suggestion.linkedin_profile_url && (
          <a
            href={suggestion.linkedin_profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium"
          >
            View Profile
          </a>
        )}
        <button
          onClick={onAddReminder}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Set Reminder
        </button>
      </div>
    </div>
  );
}
