import React from 'react';
import { PencilIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ReferenceCard({ reference, onEdit, onDelete, onRequestReference }) {
  const contact = reference.professional_contacts;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{contact?.full_name}</h3>
          <p className="text-sm text-gray-600">
            {contact?.role}
            {contact?.company && ` at ${contact.company}`}
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
          {reference.reference_type || 'Professional'}
        </span>
      </div>

      {(reference.email || contact?.email) && (
        <div className="mb-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Email:</span> {reference.email || contact.email}
          </p>
        </div>
      )}

      {(reference.phone || contact?.phone) && (
        <div className="mb-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Phone:</span> {reference.phone || contact.phone}
          </p>
        </div>
      )}

      {reference.notes && (
        <div className="mt-3 mb-4">
          <p className="text-sm text-gray-700">{reference.notes}</p>
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onRequestReference(reference)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          <DocumentTextIcon className="h-4 w-4 mr-1" />
          Request
        </button>
        <button
          onClick={() => onEdit(reference)}
          className="px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(reference.id)}
          className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
