import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contactsAPI } from '../../api/networking';
import {
  ArrowLeftIcon,
  PencilIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ContactModal from '../../components/networking/ContactModal';
import InteractionModal from '../../components/networking/InteractionModal';
import InteractionTimeline from '../../components/networking/InteractionTimeline';

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  useEffect(() => {
    fetchContact();
    fetchInteractions();
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await contactsAPI.getById(id);
      setContact(response.data);
    } catch (error) {
      console.error('Error fetching contact:', error);
      alert('Failed to load contact');
      navigate('/networking/contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    try {
      const response = await contactsAPI.getInteractions(id);
      setInteractions(response.data);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const handleAddInteraction = () => {
    setSelectedInteraction(null);
    setShowInteractionModal(true);
  };

  const handleEditInteraction = (interaction) => {
    setSelectedInteraction(interaction);
    setShowInteractionModal(true);
  };

  const handleDeleteInteraction = async (interactionId) => {
    if (window.confirm('Are you sure you want to delete this interaction?')) {
      try {
        await contactsAPI.deleteInteraction(interactionId);
        fetchInteractions();
      } catch (error) {
        console.error('Error deleting interaction:', error);
        alert('Failed to delete interaction');
      }
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowInteractionModal(false);
    setSelectedInteraction(null);
    fetchContact();
    fetchInteractions();
  };

  const calculateRelationshipStrength = () => {
    if (interactions.length === 0) return 0;
    const strengths = interactions
      .filter((i) => i.relationship_strength)
      .map((i) => i.relationship_strength);
    if (strengths.length === 0) return 0;
    return Math.round(strengths.reduce((a, b) => a + b, 0) / strengths.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  const relationshipStrength = calculateRelationshipStrength();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/networking/contacts')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Contacts
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{contact.full_name}</h2>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-primary-600 hover:text-primary-700"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </div>

            {contact.headline && (
              <p className="text-gray-600 mb-4">{contact.headline}</p>
            )}

            <div className="space-y-3 mb-6">
              {contact.company && (
                <div className="flex items-start">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{contact.company}</p>
                    {contact.role && (
                      <p className="text-sm text-gray-600">{contact.role}</p>
                    )}
                  </div>
                </div>
              )}

              {contact.industry && (
                <div className="flex items-center">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <p className="text-gray-700">{contact.industry}</p>
                </div>
              )}

              {contact.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
            </div>

            {contact.relationship_type && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {contact.relationship_type}
                </span>
              </div>
            )}

            {contact.linkedin_profile_url && (
              <a
                href={contact.linkedin_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                View LinkedIn Profile
              </a>
            )}

            {/* Relationship Strength */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Relationship Strength
                </h3>
                <span className="text-sm text-gray-500">
                  (Avg from interactions)
                </span>
              </div>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${relationshipStrength}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {relationshipStrength}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Calculated automatically from your interaction history
              </p>
            </div>

            {/* Stats */}
            <div className="border-t mt-4 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{interactions.length}</p>
                  <p className="text-xs text-gray-500">Interactions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {contact.source === 'linkedin' ? 'LinkedIn' : 'Manual'}
                  </p>
                  <p className="text-xs text-gray-500">Source</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactions Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Interaction History</h2>
              <button
                onClick={handleAddInteraction}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-md transition-all hover:shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Interaction
              </button>
            </div>

            {interactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No interactions recorded yet.</p>
                <button
                  onClick={handleAddInteraction}
                  className="mt-4 text-primary-600 hover:text-primary-700"
                >
                  Add your first interaction
                </button>
              </div>
            ) : (
              <InteractionTimeline
                interactions={interactions}
                onEdit={handleEditInteraction}
                onDelete={handleDeleteInteraction}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <ContactModal contact={contact} onClose={handleModalClose} />
      )}

      {showInteractionModal && (
        <InteractionModal
          contactId={id}
          interaction={selectedInteraction}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
