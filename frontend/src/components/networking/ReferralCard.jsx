import React from 'react';
import { 
  BriefcaseIcon, 
  UserIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

const ReferralCard = ({ referral, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseTypeColor = (responseType) => {
    switch (responseType) {
      case 'accepted':
        return 'text-green-600';
      case 'declined':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isFollowUpNeeded = () => {
    if (referral.status !== 'sent' || !referral.follow_up_date) return false;
    return new Date(referral.follow_up_date) <= new Date();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {/* Status Badge */}
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(referral.status)}`}>
            {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
          </span>
          {isFollowUpNeeded() && (
            <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Follow-up needed
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Job Info */}
      <div className="flex items-start mb-3">
        <BriefcaseIcon className="h-5 w-5 text-gray-500 mt-1 mr-3 flex-shrink-0" />
        <div>
          <div className="font-semibold text-gray-900">{referral.job?.title || 'Unknown Job'}</div>
          <div className="text-sm text-gray-600">{referral.job?.company || 'Unknown Company'}</div>
          {referral.job?.location && (
            <div className="text-sm text-gray-500">{referral.job.location}</div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex items-start mb-3">
        <UserIcon className="h-5 w-5 text-gray-500 mt-1 mr-3 flex-shrink-0" />
        <div>
          <div className="font-medium text-gray-900">
            {referral.contact?.full_name || 'Unknown Contact'}
          </div>
          <div className="text-sm text-gray-600">{referral.contact?.role || 'Contact'}</div>
          {referral.contact?.company && (
            <div className="text-sm text-gray-500">{referral.contact.company}</div>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <div className="text-sm">
            <div className="text-gray-500">Created</div>
            <div className="text-gray-900">{formatDate(referral.created_at)}</div>
          </div>
        </div>
        {referral.sent_date && (
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
            <div className="text-sm">
              <div className="text-gray-500">Sent</div>
              <div className="text-gray-900">{formatDate(referral.sent_date)}</div>
            </div>
          </div>
        )}
        {referral.follow_up_date && referral.status === 'sent' && (
          <div className="flex items-center">
            <ClockIcon className={`h-4 w-4 mr-2 ${isFollowUpNeeded() ? 'text-red-500' : 'text-gray-400'}`} />
            <div className="text-sm">
              <div className="text-gray-500">Follow-up</div>
              <div className={isFollowUpNeeded() ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {formatDate(referral.follow_up_date)}
              </div>
            </div>
          </div>
        )}
        {referral.response_date && (
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-blue-500 mr-2" />
            <div className="text-sm">
              <div className="text-gray-500">Responded</div>
              <div className="text-gray-900">{formatDate(referral.response_date)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Response Type */}
      {referral.response_type && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Response: </span>
          <span className={`text-sm font-medium ${getResponseTypeColor(referral.response_type)}`}>
            {referral.response_type.charAt(0).toUpperCase() + referral.response_type.slice(1)}
          </span>
        </div>
      )}

      {/* Notes Preview */}
      {referral.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Notes:</div>
          <div className="text-sm text-gray-700 line-clamp-2">{referral.notes}</div>
        </div>
      )}

      {/* Follow-up Count */}
      {referral.follow_up_count > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
          Follow-ups sent: {referral.follow_up_count}
        </div>
      )}
    </div>
  );
};

export default ReferralCard;
