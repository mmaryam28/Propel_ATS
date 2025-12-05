import { BuildingOfficeIcon, BriefcaseIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function ContactCard({ contact, onClick, onEdit, onDelete }) {
  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{contact.full_name}</h3>
          {contact.headline && (
            <p className="text-sm text-gray-600 mt-1">{contact.headline}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(contact);
            }}
            className="text-primary-600 hover:text-primary-700"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(contact.id);
            }}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {contact.company && (
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
            {contact.company}
            {contact.role && ` • ${contact.role}`}
          </div>
        )}

        {contact.industry && (
          <div className="flex items-center text-sm text-gray-600">
            <BriefcaseIcon className="h-4 w-4 mr-2" />
            {contact.industry}
          </div>
        )}

        {contact.email && (
          <div className="flex items-center text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            {contact.email}
          </div>
        )}

        {contact.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            {contact.phone}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {contact.relationship_type && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {contact.relationship_type}
          </span>
        )}
        {contact.source && (
          <span className="text-xs text-gray-500">
            Source: {contact.source}
          </span>
        )}
      </div>

      {contact.linkedin_profile_url && (
        <div className="mt-3">
          <a
            href={contact.linkedin_profile_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            View LinkedIn Profile
          </a>
        </div>
      )}
    </div>
  );
}
