import { 
  BuildingOfficeIcon, 
  BriefcaseIcon, 
  UserGroupIcon,
  SparklesIcon,
  EyeIcon,
  UserPlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function SuggestedContactCard({ suggestion, onViewDetails, onConnect, onAddDirectly, onIgnore }) {
  const getScoreBadgeColor = (score) => {
    if (score >= 4) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 3) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-2 border-primary-100">
      {/* Header with Score Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{suggestion.full_name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getScoreBadgeColor(suggestion.score)}`}>
              <SparklesIcon className="h-3 w-3 mr-1" />
              Score: {suggestion.score}
            </span>
          </div>
          {suggestion.headline && (
            <p className="text-sm text-gray-600">{suggestion.headline}</p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {suggestion.company && (
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {suggestion.company}
              {suggestion.role && ` • ${suggestion.role}`}
            </span>
            {suggestion.scoringDetails.inTargetCompany && (
              <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Target Company
              </span>
            )}
          </div>
        )}

        {suggestion.industry && (
          <div className="flex items-center text-sm text-gray-600">
            <BriefcaseIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{suggestion.industry}</span>
            {suggestion.scoringDetails.sameIndustry && (
              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                Same Industry
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => onViewDetails(suggestion)}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
        >
          <UserGroupIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="font-medium">
            {suggestion.mutualConnectionsCount} mutual connection{suggestion.mutualConnectionsCount !== 1 ? 's' : ''}
          </span>
          <span className="ml-1 text-gray-500">(click to view)</span>
        </button>
      </div>

      {/* Connection Path */}
      {suggestion.connectionPath && suggestion.connectionPath.length > 0 && (
        <div className="mb-4 p-2 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-500 mb-1">Connection Path:</p>
          <p className="text-sm text-gray-700 font-medium">
            {suggestion.connectionPath.join(' → ')} → {suggestion.full_name}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => onAddDirectly(suggestion)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            title="Add directly to your contacts"
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Add as Contact
          </button>
          <button
            onClick={() => onIgnore(suggestion)}
            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            title="Hide this suggestion"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(suggestion)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </button>
          <button
            onClick={() => onConnect(suggestion)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
            title="Customize before adding"
          >
            Customize & Add
          </button>
        </div>
      </div>
    </div>
  );
}
