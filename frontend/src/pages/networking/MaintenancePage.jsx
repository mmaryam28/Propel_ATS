import { useState, useEffect } from 'react';
import { relationshipMaintenanceAPI } from '../../api/relationshipMaintenance';
import { contactsAPI } from '../../api/networking';
import {
  UserPlusIcon,
  BellIcon,
  HeartIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import SuggestedContactCard from '../../components/relationship-maintenance/SuggestedContactCard';
import ReminderCard from '../../components/relationship-maintenance/ReminderCard';
import HealthScoreCard from '../../components/relationship-maintenance/HealthScoreCard';
import ReminderModal from '../../components/relationship-maintenance/ReminderModal';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('reminders'); // reminders, suggestions, health
  const [suggestions, setSuggestions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [healthScores, setHealthScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    totalReminders: 0,
    upcomingCount: 0,
    overdueCount: 0,
    atRiskCount: 0,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Always fetch contacts for the ReminderModal
      const contactsRes = await contactsAPI.getAll();
      setContacts(contactsRes.data);
      
      if (activeTab === 'suggestions') {
        const suggestionsRes = await relationshipMaintenanceAPI.getSuggestedContacts();
        setSuggestions(suggestionsRes.data);
      } else if (activeTab === 'reminders') {
        const [allReminders, upcoming, overdue] = await Promise.all([
          relationshipMaintenanceAPI.getReminders(),
          relationshipMaintenanceAPI.getUpcomingReminders(),
          relationshipMaintenanceAPI.getOverdueReminders(),
        ]);
        setReminders(allReminders.data);
        setUpcomingReminders(upcoming.data);
        setOverdueReminders(overdue.data);
        
        setStats({
          totalReminders: allReminders.data.filter(r => r.status === 'pending').length,
          upcomingCount: upcoming.data.length,
          overdueCount: overdue.data.length,
          atRiskCount: stats.atRiskCount,
        });
      } else if (activeTab === 'health') {
        const healthRes = await relationshipMaintenanceAPI.getHealthScores();
        setHealthScores(healthRes.data);
        
        const atRisk = healthRes.data.filter(h => h.status === 'at_risk').length;
        setStats(prev => ({ ...prev, atRiskCount: atRisk }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      await relationshipMaintenanceAPI.autoGenerateReminders(60);
      alert('Reminders generated for contacts with no recent interactions!');
      fetchData();
    } catch (error) {
      console.error('Error auto-generating reminders:', error);
      alert('Failed to generate reminders');
    }
  };

  const handleCreateReminder = (contact) => {
    setSelectedContact(contact);
    setShowReminderModal(true);
  };

  const handleReminderModalClose = () => {
    setShowReminderModal(false);
    setSelectedContact(null);
    fetchData();
  };

  const handleCompleteReminder = async (reminderId) => {
    try {
      await relationshipMaintenanceAPI.updateReminder(reminderId, { status: 'completed' });
      fetchData();
    } catch (error) {
      console.error('Error completing reminder:', error);
      alert('Failed to complete reminder');
    }
  };

  const handleSnoozeReminder = async (reminderId) => {
    try {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      await relationshipMaintenanceAPI.updateReminder(reminderId, {
        status: 'pending',
        reminderDate: newDate.toISOString(),
      });
      fetchData();
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      alert('Failed to snooze reminder');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await relationshipMaintenanceAPI.deleteReminder(reminderId);
        fetchData();
      } catch (error) {
        console.error('Error deleting reminder:', error);
        alert('Failed to delete reminder');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Relationship Maintenance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Strengthen your network with smart reminders and suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAutoGenerate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Auto-Generate
          </button>
          <button
            onClick={() => setShowReminderModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Reminder
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Active Reminders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReminders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">At Risk</p>
              <p className="text-2xl font-bold text-gray-900">{stats.atRiskCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'reminders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BellIcon className="h-5 w-5 inline mr-2" />
              Reminders
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'suggestions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlusIcon className="h-5 w-5 inline mr-2" />
              Suggested Contacts
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'health'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HeartIcon className="h-5 w-5 inline mr-2" />
              Relationship Health
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              {/* Overdue Section */}
              {overdueReminders.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    Overdue ({overdueReminders.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overdueReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={() => handleCompleteReminder(reminder.id)}
                        onSnooze={() => handleSnoozeReminder(reminder.id)}
                        onDelete={() => handleDeleteReminder(reminder.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Section */}
              {upcomingReminders.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Upcoming (Next 7 Days)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={() => handleCompleteReminder(reminder.id)}
                        onSnooze={() => handleSnoozeReminder(reminder.id)}
                        onDelete={() => handleDeleteReminder(reminder.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Reminders */}
              {reminders.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No pending reminders. Great job staying connected!</p>
                  <button
                    onClick={handleAutoGenerate}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Generate Reminders
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div>
              {suggestions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <UserPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No suggested contacts at this time</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Add more contacts and interactions to get personalized suggestions
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((suggestion) => (
                    <SuggestedContactCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onAddReminder={() => handleCreateReminder(suggestion)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && (
            <div>
              {healthScores.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No relationship health data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {healthScores.map((score) => (
                    <HealthScoreCard
                      key={score.contactId}
                      healthScore={score}
                      onAddReminder={() =>
                        handleCreateReminder({
                          id: score.contactId,
                          full_name: score.fullName,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal
          contact={selectedContact}
          contacts={contacts}
          onClose={handleReminderModalClose}
        />
      )}
    </div>
  );
}
