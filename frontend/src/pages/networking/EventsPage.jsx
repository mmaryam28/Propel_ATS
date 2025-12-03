import { useState, useEffect } from 'react';
import { CalendarIcon, MapPinIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import { networkingEventsAPI } from '../../api/networking-events';
import EventCard from '../../components/networking/EventCard';
import EventModal from '../../components/networking/EventModal';
import ConnectionLogModal from '../../components/networking/ConnectionLogModal';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, follow-ups
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, follow-ups, connections

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await networkingEventsAPI.getAllEvents();
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await networkingEventsAPI.getEventStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't set error for stats, just log it
    }
  };

  const handleEventModalClose = (shouldRefresh) => {
    setShowEventModal(false);
    setSelectedEvent(null);
    if (shouldRefresh) {
      fetchEvents();
      fetchStats();
    }
  };

  const handleConnectionModalClose = (shouldRefresh) => {
    setShowConnectionModal(false);
    setSelectedEvent(null);
    if (shouldRefresh) {
      fetchEvents();
      fetchStats();
    }
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleAddConnections = (event) => {
    setSelectedEvent(event);
    setShowConnectionModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await networkingEventsAPI.deleteEvent(eventId);
      fetchEvents();
      fetchStats();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    const eventDate = new Date(event.event_date);
    const now = new Date();
    if (filter === 'upcoming') return eventDate >= now;
    if (filter === 'past') return eventDate < now;
    if (filter === 'follow-ups') {
      return event.event_connections?.some(c => c.follow_up_needed) || false;
    }
    return true;
  }).sort((a, b) => {
    // Sort by selected criteria
    if (sortBy === 'date-desc') {
      return new Date(b.event_date) - new Date(a.event_date);
    }
    if (sortBy === 'date-asc') {
      return new Date(a.event_date) - new Date(b.event_date);
    }
    if (sortBy === 'follow-ups') {
      const aFollowUps = a.event_connections?.filter(c => c.follow_up_needed).length || 0;
      const bFollowUps = b.event_connections?.filter(c => c.follow_up_needed).length || 0;
      return bFollowUps - aFollowUps;
    }
    if (sortBy === 'connections') {
      const aConnections = a.event_connections?.length || 0;
      const bConnections = b.event_connections?.length || 0;
      return bConnections - aConnections;
    }
    return 0;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Networking Events</h1>
        <button
          onClick={() => setShowEventModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Event
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={() => { setError(null); fetchEvents(); fetchStats(); }}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Past Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pastEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Connections</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConnections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFollowUps}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-md ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-md ${
              filter === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Past Events
          </button>
          <button
            onClick={() => setFilter('follow-ups')}
            className={`px-4 py-2 rounded-md flex items-center ${
              filter === 'follow-ups'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Needs Follow-up
            {stats && stats.pendingFollowUps > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                filter === 'follow-ups' ? 'bg-red-800' : 'bg-red-600 text-white'
              }`}>
                {stats.pendingFollowUps}
              </span>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="follow-ups">Follow-ups (Most First)</option>
            <option value="connections">Connections (Most First)</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No events found. Create your first networking event!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onAddConnections={handleAddConnections}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={handleEventModalClose}
        />
      )}

      {showConnectionModal && selectedEvent && (
        <ConnectionLogModal
          event={selectedEvent}
          onClose={handleConnectionModalClose}
          onRefresh={() => { fetchEvents(); fetchStats(); }}
        />
      )}
    </div>
  );
}
