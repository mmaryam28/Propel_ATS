import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contactsAPI, linkedinAuthAPI, discoveryAPI } from '../../api/networking';
import { PlusIcon, FunnelIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ContactCard from '../../components/networking/ContactCard';
import ContactModal from '../../components/networking/ContactModal';
import LinkedInConnect from '../../components/networking/LinkedInConnect';
import SuggestedContactCard from '../../components/networking/SuggestedContactCard';
import ConnectionPathModal from '../../components/networking/ConnectionPathModal';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [suggestedContactData, setSuggestedContactData] = useState(null);
  const [showPathModal, setShowPathModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [linkedinStatus, setLinkedinStatus] = useState({ connected: false });
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    industry: '',
    relationshipType: '',
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchContacts();
    fetchStats();
    fetchSuggestions();

    // Check for LinkedIn connection success
    if (searchParams.get('linkedin_connected') === 'true') {
      alert('LinkedIn account connected successfully!');
      window.history.replaceState({}, '', '/networking/contacts');
      // Fetch LinkedIn status after successful connection
      fetchLinkedInStatus();
    } else {
      // Fetch status normally if no redirect
      fetchLinkedInStatus();
    }

    // Check for errors
    const error = searchParams.get('error');
    if (error) {
      alert(`Error: ${error}`);
      window.history.replaceState({}, '', '/networking/contacts');
    }
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await contactsAPI.getAll(filters);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedInStatus = async () => {
    try {
      const response = await linkedinAuthAPI.getStatus();
      setLinkedinStatus(response.data);
    } catch (error) {
      console.error('Error fetching LinkedIn status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await contactsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const response = await discoveryAPI.getSuggestions();
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchContacts();
  };

  const handleCreateContact = () => {
    setSelectedContact(null);
    setShowModal(true);
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleDeleteContact = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactsAPI.delete(contactId);
        fetchContacts();
        fetchStats();
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedContact(null);
    setSuggestedContactData(null);
    fetchContacts();
    fetchStats();
    fetchSuggestions();
  };

  const handleContactClick = (contact) => {
    navigate(`/networking/contacts/${contact.id}`);
  };

  const handleViewSuggestionDetails = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowPathModal(true);
    // Track view action
    discoveryAPI.trackAction({
      suggestedContactId: suggestion.id,
      action: 'viewed',
    }).catch(err => console.error('Error tracking view:', err));
  };

  const handleConnectSuggestion = (suggestion) => {
    setSuggestedContactData(suggestion);
    setSelectedContact(null);
    setShowModal(true);
    // Track accept action
    discoveryAPI.trackAction({
      suggestedContactId: suggestion.id,
      action: 'accepted',
    }).catch(err => console.error('Error tracking accept:', err));
  };

  const handleIgnoreSuggestion = async (suggestion) => {
    if (window.confirm('Hide this suggestion?')) {
      try {
        await discoveryAPI.trackAction({
          suggestedContactId: suggestion.id,
          action: 'ignored',
        });
        // Remove from suggestions list
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      } catch (error) {
        console.error('Error ignoring suggestion:', error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Professional Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your professional network and track interactions
          </p>
        </div>
        <button
          onClick={handleCreateContact}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Contact
        </button>
      </div>

      {/* LinkedIn Integration */}
      <LinkedInConnect
        status={linkedinStatus}
        onRefresh={fetchLinkedInStatus}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Interactions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalInteractions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Companies</p>
            <p className="text-2xl font-bold text-gray-900">{stats.companiesCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Industries</p>
            <p className="text-2xl font-bold text-gray-900">{stats.industriesCount}</p>
          </div>
        </div>
      )}

      {/* Suggested Connections Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Suggested Connections
            </h2>
            {suggestions.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                {suggestions.length} new
              </span>
            )}
          </div>
          {!suggestionsLoading && (
            <button
              onClick={fetchSuggestions}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Refresh
            </button>
          )}
        </div>
        
        {suggestionsLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-3 text-gray-500">Loading suggestions...</p>
            </div>
          </div>
        ) : suggestions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {suggestions.slice(0, 6).map((suggestion) => (
                <SuggestedContactCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onViewDetails={handleViewSuggestionDetails}
                  onConnect={handleConnectSuggestion}
                  onIgnore={handleIgnoreSuggestion}
                />
              ))}
            </div>
            {suggestions.length > 6 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  + {suggestions.length - 6} more suggestions available
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-8 border border-blue-100">
            <div className="text-center">
              <SparklesIcon className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Suggestions Yet
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
                Add more contacts and their connections to get personalized connection suggestions based on mutual contacts, shared industries, and target companies.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center text-xs text-gray-500">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200">
                  ℹ️ Suggestions are based on 2nd-degree connections
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200">
                  🎯 Scored by industry match & mutual connections
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, or role..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <select
            value={filters.relationshipType}
            onChange={(e) => setFilters({ ...filters, relationshipType: e.target.value })}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Relationship Types</option>
            <option value="colleague">Colleague</option>
            <option value="mentor">Mentor</option>
            <option value="recruiter">Recruiter</option>
            <option value="friend">Friend</option>
            <option value="linkedin_connection">LinkedIn Connection</option>
            <option value="referral">Referral</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-500">Loading contacts...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No contacts found. Add your first contact to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onClick={() => handleContactClick(contact)}
              onEdit={() => handleEditContact(contact)}
              onDelete={() => handleDeleteContact(contact.id)}
            />
          ))}
        </div>
      )}

      {/* Contact Modal */}
      {showModal && (
        <ContactModal
          contact={selectedContact}
          initialData={suggestedContactData}
          onClose={handleModalClose}
        />
      )}

      {/* Connection Path Modal */}
      {showPathModal && selectedSuggestion && (
        <ConnectionPathModal
          suggestion={selectedSuggestion}
          onClose={() => {
            setShowPathModal(false);
            setSelectedSuggestion(null);
          }}
          onConnect={handleConnectSuggestion}
        />
      )}
    </div>
  );
}
