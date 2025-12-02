import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const NetworkingAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Filters
  const [timeframe, setTimeframe] = useState('3months');
  const [industryFilter, setIndustryFilter] = useState('');
  
  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // Form state
  const [contactForm, setContactForm] = useState({
    contact_name: '',
    company: '',
    job_title: '',
    industry: '',
    connection_source: 'linkedin',
    relationship_strength: 3,
    first_contact_date: new Date().toISOString().split('T')[0],
    referrals_given: 0,
    referrals_received: 0,
    job_opportunities_sourced: 0,
    value_provided_score: 5,
    value_received_score: 5,
    notes: ''
  });
  
  const [activityForm, setActivityForm] = useState({
    contact_id: '',
    activity_type: 'message',
    activity_date: new Date().toISOString().split('T')[0],
    duration_minutes: 30,
    outcome: 'positive',
    value_exchange: '',
    notes: ''
  });

  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_type: 'conference',
    event_date: new Date().toISOString().split('T')[0],
    cost: 0,
    time_invested_hours: 2,
    leads_generated: 0,
    opportunities_created: 0,
    notes: ''
  });

  const API_URL = 'http://localhost:3000';

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (industryFilter) params.append('industry', industryFilter);
      
      const response = await fetch(`${API_URL}/networking/analytics/overview?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      console.log('Dashboard data received:', data);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/networking/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch activities
  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/networking/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/networking/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Create/Update contact
  const saveContact = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Prepare contact data and clean up empty fields
      const contactData = {
        contact_name: contactForm.contact_name,
        first_contact_date: contactForm.first_contact_date,
        ...(contactForm.company && { company: contactForm.company }),
        ...(contactForm.job_title && { job_title: contactForm.job_title }),
        ...(contactForm.industry && { industry: contactForm.industry }),
        ...(contactForm.connection_source && { connection_source: contactForm.connection_source }),
        ...(contactForm.relationship_strength && { relationship_strength: parseInt(contactForm.relationship_strength) }),
        referrals_given: parseInt(contactForm.referrals_given) || 0,
        referrals_received: parseInt(contactForm.referrals_received) || 0,
        job_opportunities_sourced: parseInt(contactForm.job_opportunities_sourced) || 0,
        value_provided_score: parseInt(contactForm.value_provided_score) || 0,
        value_received_score: parseInt(contactForm.value_received_score) || 0,
        ...(contactForm.notes && { notes: contactForm.notes })
      };
      
      // Log request details
      console.log('Saving contact with data:', contactData);
      console.log('Token exists:', !!token);
      
      const url = editingContact 
        ? `${API_URL}/networking/contacts/${editingContact.id}`
        : `${API_URL}/networking/contacts`;
      
      const method = editingContact ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save contact' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Failed to save contact: ${response.status}`);
      }
      
      setContactModalOpen(false);
      setEditingContact(null);
      resetContactForm();
      fetchContacts();
      fetchDashboard();
    } catch (err) {
      console.error('Save contact error:', err);
      setError(err.message);
    }
  };

  // Delete contact
  const deleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/networking/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete contact');
      
      fetchContacts();
      fetchDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  // Create activity
  const saveActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Prepare activity data and clean up empty fields
      const activityData = {
        activity_type: activityForm.activity_type,
        activity_date: activityForm.activity_date,
        ...(activityForm.contact_id && { contact_id: String(activityForm.contact_id) }),
        ...(activityForm.duration_minutes && { duration_minutes: parseInt(activityForm.duration_minutes) }),
        ...(activityForm.outcome && { outcome: activityForm.outcome }),
        ...(activityForm.value_exchange && { value_exchange: activityForm.value_exchange }),
        ...(activityForm.notes && { notes: activityForm.notes })
      };
      
      console.log('Saving activity with data:', activityData);
      
      const response = await fetch(`${API_URL}/networking/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save activity' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Failed to save activity: ${response.status}`);
      }
      
      setActivityModalOpen(false);
      resetActivityForm();
      fetchActivities();
      fetchDashboard();
    } catch (err) {
      console.error('Save activity error:', err);
      setError(err.message);
    }
  };

  // Create event
  const saveEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const eventData = {
        event_name: eventForm.event_name,
        event_type: eventForm.event_type,
        event_date: eventForm.event_date,
        cost: parseFloat(eventForm.cost) || 0,
        time_invested_hours: parseFloat(eventForm.time_invested_hours) || 0,
        leads_generated: parseInt(eventForm.leads_generated) || 0,
        opportunities_created: parseInt(eventForm.opportunities_created) || 0,
        ...(eventForm.notes && { notes: eventForm.notes })
      };
      
      console.log('Saving event with data:', eventData);
      
      const response = await fetch(`${API_URL}/networking/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save event' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Failed to save event: ${response.status}`);
      }
      
      setEventModalOpen(false);
      resetEventForm();
      fetchEvents();
      fetchDashboard();
    } catch (err) {
      console.error('Save event error:', err);
      setError(err.message);
    }
  };

  const resetContactForm = () => {
    setContactForm({
      contact_name: '',
      company: '',
      job_title: '',
      industry: '',
      connection_source: 'linkedin',
      relationship_strength: 3,
      first_contact_date: new Date().toISOString().split('T')[0],
      referrals_given: 0,
      referrals_received: 0,
      job_opportunities_sourced: 0,
      value_provided_score: 5,
      value_received_score: 5,
      notes: ''
    });
  };

  const resetActivityForm = () => {
    setActivityForm({
      contact_id: '',
      activity_type: 'message',
      activity_date: new Date().toISOString().split('T')[0],
      duration_minutes: 30,
      outcome: 'positive',
      value_exchange: '',
      notes: ''
    });
  };

  const resetEventForm = () => {
    setEventForm({
      event_name: '',
      event_type: 'conference',
      event_date: new Date().toISOString().split('T')[0],
      cost: 0,
      time_invested_hours: 2,
      leads_generated: 0,
      opportunities_created: 0,
      notes: ''
    });
  };

  const openEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      contact_name: contact.contact_name,
      company: contact.company || '',
      job_title: contact.job_title || '',
      industry: contact.industry || '',
      connection_source: contact.connection_source,
      relationship_strength: contact.relationship_strength,
      first_contact_date: contact.first_contact_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      referrals_given: contact.referrals_given || 0,
      referrals_received: contact.referrals_received || 0,
      job_opportunities_sourced: contact.job_opportunities_sourced || 0,
      value_provided_score: contact.value_provided_score || 5,
      value_received_score: contact.value_received_score || 5,
      notes: contact.notes || ''
    });
    setContactModalOpen(true);
  };

  useEffect(() => {
    fetchDashboard();
    fetchContacts();
    fetchActivities();
    fetchEvents();
  }, [timeframe, industryFilter]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'volume', label: 'Activity' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'relationships', label: 'Quality' },
    { id: 'roi', label: 'Event ROI' },
    { id: 'value', label: 'Value' },
    { id: 'insights', label: 'Insights' },
  ];

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading network analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96 p-6">
          <div className="text-red-500 text-center">{error}</div>
          <button onClick={fetchDashboard} className="btn btn-primary w-full mt-4">Retry</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Network ROI & Analytics</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => { resetContactForm(); setContactModalOpen(true); }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Icon name="plus" size="sm" /> Add Contact
          </button>
          <button 
            onClick={() => { resetActivityForm(); setActivityModalOpen(true); }} 
            className="btn btn-outline flex items-center gap-2"
          >
            <Icon name="plus" size="sm" /> Log Activity
          </button>
          <button 
            onClick={() => { resetEventForm(); setEventModalOpen(true); }} 
            className="btn btn-outline flex items-center gap-2"
          >
            <Icon name="plus" size="sm" /> Add Event
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="text-sm font-medium">Total Contacts</Card.Title>
                  <Icon name="users" size="sm" className="text-gray-500" />
                </div>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.relationship_analysis?.total_contacts || 0}</div>
                <p className="text-xs text-gray-500">
                  {dashboardData?.relationship_analysis?.strong_relationships || 0} strong relationships
                </p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="text-sm font-medium">Total Activities</Card.Title>
                  <Icon name="activity" size="sm" className="text-gray-500" />
                </div>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.activity_volume?.total_activities || 0}</div>
                <p className="text-xs text-gray-500">
                  {dashboardData?.activity_volume?.avg_per_week?.toFixed(1) || 0} per week
                </p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="text-sm font-medium">Referrals Generated</Card.Title>
                  <Icon name="trending-up" size="sm" className="text-gray-500" />
                </div>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.referral_metrics?.total_referrals_given || 0}</div>
                <p className="text-xs text-gray-500">
                  {dashboardData?.referral_metrics?.job_opportunities_sourced || 0} job opportunities
                </p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="text-sm font-medium">Reciprocity Index</Card.Title>
                  <Icon name="gift" size="sm" className="text-gray-500" />
                </div>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.value_exchange?.reciprocity_index?.toFixed(0) || 100}</div>
                <p className="text-xs text-gray-500">
                  {dashboardData?.value_exchange?.reciprocity_index < 80 ? 'Taking more' : 
                   dashboardData?.value_exchange?.reciprocity_index > 120 ? 'Giving more' : 'Balanced'}
                </p>
              </Card.Body>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Activity Volume Trend</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.activity_volume?.monthly_trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.activity_volume.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No activity data yet
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Activities by Type</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.activity_volume?.activities_by_type && Object.keys(dashboardData.activity_volume.activities_by_type).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.activity_volume.activities_by_type).map(([type, count]) => ({
                          name: type.replace('_', ' '),
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(dashboardData.activity_volume.activities_by_type).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No activities logged yet
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Relationship Strength Distribution</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.relationship_analysis?.contacts_by_strength && Object.keys(dashboardData.relationship_analysis.contacts_by_strength).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(dashboardData.relationship_analysis.contacts_by_strength).map(([strength, count]) => ({
                      strength: `Level ${strength}`,
                      count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="strength" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No contacts yet
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Network Growth</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.relationship_analysis?.relationship_growth_trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.relationship_analysis.relationship_growth_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="new_contacts" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No growth data yet
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <Card>
          <Card.Header>
            <Card.Title>Your Network Contacts</Card.Title>
          </Card.Header>
          <Card.Body>
            {contacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="users" size={48} className="mx-auto mb-4 opacity-50" />
                <p>No contacts yet. Add your first contact to start building your network!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Industry</th>
                      <th className="text-left p-2">Strength</th>
                      <th className="text-left p-2">Interactions</th>
                      <th className="text-left p-2">Last Contact</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(contact => (
                      <tr key={contact.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{contact.contact_name}</td>
                        <td className="p-2">{contact.company || '-'}</td>
                        <td className="p-2">{contact.job_title || '-'}</td>
                        <td className="p-2">{contact.industry || '-'}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < contact.relationship_strength ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-2">{contact.total_interactions || 0}</td>
                        <td className="p-2">
                          {contact.last_interaction_date 
                            ? new Date(contact.last_interaction_date).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditContact(contact)}>
                              <Icon name="edit" size="sm" />
                            </button>
                            <button className="text-red-600 hover:text-red-800" onClick={() => deleteContact(contact.id)}>
                              <Icon name="trash" size="sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Activity Volume Tab */}
      {activeTab === 'volume' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Total Activities</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.activity_volume?.total_activities || 0}</div>
                <p className="text-xs text-gray-500">All time</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Avg Per Week</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.activity_volume?.avg_per_week?.toFixed(1) || 0}</div>
                <p className="text-xs text-gray-500">Last 3 months</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">This Month</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.activity_volume?.current_month || 0}</div>
                <p className="text-xs text-gray-500">Activities logged</p>
              </Card.Body>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Activity Timeline</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.activity_volume?.monthly_trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.activity_volume.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Activities" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No activity data yet
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Activities by Type</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.activity_volume?.activities_by_type && Object.keys(dashboardData.activity_volume.activities_by_type).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(dashboardData.activity_volume.activities_by_type).map(([activity_type, count]) => ({
                      activity_type,
                      count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="activity_type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No activity data yet
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Recent Activities</Card.Title>
            </Card.Header>
            <Card.Body>
              {activities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No activities logged yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.slice(0, 10).map(activity => (
                    <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{activity.activity_type}</div>
                        <div className="text-sm text-gray-600">
                          {activity.contact_name || 'General activity'} • {new Date(activity.activity_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{activity.duration_minutes} min</div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Referrals Given</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.referral_metrics?.total_referrals_given || 0}</div>
                <p className="text-xs text-gray-500">Total provided</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Referrals Received</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.referral_metrics?.total_referrals_received || 0}</div>
                <p className="text-xs text-gray-500">Total received</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Job Opportunities</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.referral_metrics?.job_opportunities_sourced || 0}</div>
                <p className="text-xs text-gray-500">Sourced from network</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Conversion Rate</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.referral_metrics?.conversion_rate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-gray-500">Opportunities to referrals</p>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Top Referral Sources</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.referral_metrics?.top_referral_sources?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.referral_metrics.top_referral_sources.map((source, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{source.contact_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">{source.referrals_count}</div>
                        <div className="text-xs text-gray-500">referrals</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No referral data yet. Update contact information to track referrals.
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Relationships Quality Tab */}
      {activeTab === 'relationships' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Strong Relationships</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.relationship_analysis?.strong_relationships || 0}</div>
                <p className="text-xs text-gray-500">Strength 4-5</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Engagement Quality</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.relationship_analysis?.avg_relationship_strength?.toFixed(1) || 0}</div>
                <p className="text-xs text-gray-500">Avg strength score</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Dormant Contacts</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold text-orange-600">{dashboardData?.relationship_analysis?.dormant_contacts?.length || 0}</div>
                <p className="text-xs text-gray-500">90+ days inactive</p>
              </Card.Body>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Relationship Strength Distribution</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.relationship_analysis?.contacts_by_strength && Object.keys(dashboardData.relationship_analysis.contacts_by_strength).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.relationship_analysis.contacts_by_strength).map(([strength, count]) => ({
                          strength_level: `Level ${strength}`,
                          count: count
                        }))}
                        dataKey="count"
                        nameKey="strength_level"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {Object.keys(dashboardData.relationship_analysis.contacts_by_strength).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No relationship data yet
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Network Growth</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.relationship_analysis?.relationship_growth_trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.relationship_analysis.relationship_growth_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="new_contacts" name="New Contacts" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No growth data yet
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {dashboardData?.relationship_analysis?.dormant_contacts?.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <Card.Header>
                <Card.Title className="text-orange-800">⚠️ Dormant Contacts Alert</Card.Title>
              </Card.Header>
              <Card.Body>
                <p className="text-orange-700 mb-3">
                  You have {dashboardData.relationship_analysis.dormant_contacts.length} contacts you haven't interacted with in over 90 days.
                  Consider reaching out to maintain these relationships.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dashboardData.relationship_analysis.dormant_contacts.map((contact, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="font-medium">{contact.contact_name}</span>
                      <span className="text-sm text-orange-600">{contact.days_since_last_contact} days ago</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {/* Event ROI Tab */}
      {activeTab === 'roi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Total Events</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.event_roi?.events_attended || 0}</div>
                <p className="text-xs text-gray-500">Attended</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Total Investment</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">${dashboardData?.event_roi?.total_cost || 0}</div>
                <p className="text-xs text-gray-500">Cost + time value</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Leads Generated</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.event_roi?.total_leads || 0}</div>
                <p className="text-xs text-gray-500">From events</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Avg ROI</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.event_roi?.average_roi?.toFixed(0) || 0}%</div>
                <p className="text-xs text-gray-500">Return on investment</p>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Best Performing Event Types</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.event_roi?.best_event_types?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.event_roi.best_event_types}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event_type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_roi" name="Avg ROI %" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No event data yet. Add events to track ROI.
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Recent Events</Card.Title>
            </Card.Header>
            <Card.Body>
              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No events tracked yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map(event => (
                    <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{event.event_name}</div>
                        <div className="text-sm text-gray-600">
                          {event.event_type} • {new Date(event.event_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{event.roi_score?.toFixed(0) || 0}%</div>
                        <div className="text-xs text-gray-500">{event.leads_generated || 0} leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Value Exchange Tab */}
      {activeTab === 'value' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Reciprocity Index</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.value_exchange?.reciprocity_index?.toFixed(0) || 100}</div>
                <p className="text-xs text-gray-500">
                  {dashboardData?.value_exchange?.reciprocity_index < 80 ? 'Taking more' : 
                   dashboardData?.value_exchange?.reciprocity_index > 120 ? 'Giving more' : 'Balanced'}
                </p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Value Provided</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.value_exchange?.giving_score?.toFixed(1) || 0}</div>
                <p className="text-xs text-gray-500">Avg score (0-10)</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Value Received</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.value_exchange?.receiving_score?.toFixed(1) || 0}</div>
                <p className="text-xs text-gray-500">Avg score (0-10)</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-sm font-medium">Mutual Value</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="text-2xl font-bold">{dashboardData?.value_exchange?.top_mutual_contacts?.filter(c => c.value_provided_score >= 7 && c.value_received_score >= 7).length || 0}</div>
                <p className="text-xs text-gray-500">High value both ways</p>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Top Mutual Value Contacts</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.value_exchange?.top_mutual_contacts?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.value_exchange.top_mutual_contacts.map((contact, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{contact.contact_name}</div>
                        <div className="text-sm text-gray-600">{contact.company || 'No company'}</div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-right">
                          <div className="text-green-600 font-semibold">↑ {contact.value_provided_score}/10</div>
                          <div className="text-xs text-gray-500">Provided</div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-600 font-semibold">↓ {contact.value_received_score}/10</div>
                          <div className="text-xs text-gray-500">Received</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No value exchange data yet. Update contacts with value scores.
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className={dashboardData?.value_exchange?.reciprocity_index < 80 ? 'border-orange-200 bg-orange-50' : 
                           dashboardData?.value_exchange?.reciprocity_index > 120 ? 'border-blue-200 bg-blue-50' : 
                           'border-green-200 bg-green-50'}>
            <Card.Header>
              <Card.Title>
                {dashboardData?.value_exchange?.reciprocity_index < 80 ? '⚠️ Taking More Than Giving' :
                 dashboardData?.value_exchange?.reciprocity_index > 120 ? 'ℹ️ Giving More Than Receiving' :
                 '✅ Balanced Exchange'}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <p className={dashboardData?.value_exchange?.reciprocity_index < 80 ? 'text-orange-700' :
                           dashboardData?.value_exchange?.reciprocity_index > 120 ? 'text-blue-700' :
                           'text-green-700'}>
                {dashboardData?.value_exchange?.reciprocity_index < 80 
                  ? 'Consider how you can provide more value to your network. Strong relationships are built on mutual benefit.'
                  : dashboardData?.value_exchange?.reciprocity_index > 120
                  ? 'You\'re very generous! Make sure you\'re also comfortable asking for help when needed.'
                  : 'Great balance! You\'re maintaining healthy, reciprocal relationships.'}
              </p>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Best Performing Strategies</Card.Title>
            </Card.Header>
            <Card.Body>
              {dashboardData?.insights?.best_performing_strategies?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.insights.best_performing_strategies.map((strategy, idx) => (
                    <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-green-900">{strategy.strategy}</div>
                        <div className="text-green-700 font-bold">{strategy.success_rate?.toFixed(1)}% success</div>
                      </div>
                      <div className="text-sm text-green-800">
                        {strategy.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No insights available yet. Log more activities with outcomes to generate insights.
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Optimization Recommendations</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {dashboardData?.relationship_analysis?.dormant_contacts > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="font-medium text-orange-900">Re-engage dormant contacts</div>
                    <div className="text-sm text-orange-700">
                      {dashboardData.relationship_analysis.dormant_contacts} contacts need attention
                    </div>
                  </div>
                )}
                {(dashboardData?.activity_volume?.avg_per_week || 0) < 2 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="font-medium text-blue-900">Increase activity frequency</div>
                    <div className="text-sm text-blue-700">
                      Aim for 2-3 networking activities per week for optimal results
                    </div>
                  </div>
                )}
                {(dashboardData?.value_exchange?.reciprocity_index || 100) < 80 && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                    <div className="font-medium text-purple-900">Provide more value</div>
                    <div className="text-sm text-purple-700">
                      Focus on helping others to strengthen relationships
                    </div>
                  </div>
                )}
                {(dashboardData?.relationship_analysis?.avg_relationship_strength || 0) < 3 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-900">Deepen relationships</div>
                    <div className="text-sm text-red-700">
                      Average relationship strength is low. Focus on quality interactions
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Time Allocation</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.insights?.time_allocation_suggestions && Object.keys(dashboardData.insights.time_allocation_suggestions).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(dashboardData.insights.time_allocation_suggestions).map(([activity_type, total_minutes]) => ({
                      activity_type,
                      total_minutes
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="activity_type" />
                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_minutes" name="Time Spent (minutes)" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No time allocation data yet
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Industry Benchmarks</Card.Title>
              </Card.Header>
              <Card.Body>
                {dashboardData?.benchmarks ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Weekly Activities</span>
                        <span className="text-sm font-semibold">
                          {dashboardData.activity_volume?.avg_per_week?.toFixed(1) || 0} vs 3.5 avg
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, ((dashboardData.activity_volume?.avg_per_week || 0) / 3.5) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Network Size</span>
                        <span className="text-sm font-semibold">
                          {dashboardData.relationship_analysis?.total_contacts || 0} vs 50 avg
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, ((dashboardData.relationship_analysis?.total_contacts || 0) / 50) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Relationship Quality</span>
                        <span className="text-sm font-semibold">
                          {dashboardData.relationship_analysis?.avg_relationship_strength?.toFixed(1) || 0} vs 3.5 avg
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, ((dashboardData.relationship_analysis?.avg_relationship_strength || 0) / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No benchmark data available
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input
                  className="input w-full"
                  value={contactForm.contact_name}
                  onChange={(e) => setContactForm({ ...contactForm, contact_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  className="input w-full"
                  value={contactForm.company}
                  onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  className="input w-full"
                  value={contactForm.job_title}
                  onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  className="input w-full"
                  value={contactForm.industry}
                  onChange={(e) => setContactForm({ ...contactForm, industry: e.target.value })}
                  placeholder="Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection Source</label>
                <select
                  className="input w-full"
                  value={contactForm.connection_source}
                  onChange={(e) => setContactForm({ ...contactForm, connection_source: e.target.value })}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="event">Event</option>
                  <option value="referral">Referral</option>
                  <option value="cold_outreach">Cold Outreach</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Strength (1-5)</label>
                <input
                  className="input w-full"
                  type="number"
                  min="1"
                  max="5"
                  value={contactForm.relationship_strength}
                  onChange={(e) => setContactForm({ ...contactForm, relationship_strength: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Contact Date</label>
                <input
                  className="input w-full"
                  type="date"
                  value={contactForm.first_contact_date}
                  onChange={(e) => setContactForm({ ...contactForm, first_contact_date: e.target.value })}
                />
              </div>
              
              {/* Referral Tracking */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold mb-3 text-gray-800">Referral Tracking</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referrals Given</label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      value={contactForm.referrals_given}
                      onChange={(e) => setContactForm({ ...contactForm, referrals_given: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referrals Received</label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      value={contactForm.referrals_received}
                      onChange={(e) => setContactForm({ ...contactForm, referrals_received: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Opportunities</label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      value={contactForm.job_opportunities_sourced}
                      onChange={(e) => setContactForm({ ...contactForm, job_opportunities_sourced: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Value Exchange */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold mb-3 text-gray-800">Value Exchange (0-10)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value You Provided</label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      max="10"
                      value={contactForm.value_provided_score}
                      onChange={(e) => setContactForm({ ...contactForm, value_provided_score: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">How much value have you given them?</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value You Received</label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      max="10"
                      value={contactForm.value_received_score}
                      onChange={(e) => setContactForm({ ...contactForm, value_received_score: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">How much value have you received from them?</p>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input w-full min-h-[100px]"
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="Additional notes about this contact..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="btn btn-outline" 
                onClick={() => { setContactModalOpen(false); setEditingContact(null); }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveContact}>
                {editingContact ? 'Update' : 'Create'} Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {activityModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Log Networking Activity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact (optional)</label>
                <select
                  className="input w-full"
                  value={activityForm.contact_id}
                  onChange={(e) => setActivityForm({ ...activityForm, contact_id: e.target.value })}
                >
                  <option value="">General networking activity</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.contact_name} - {contact.company || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
                <select
                  className="input w-full"
                  value={activityForm.activity_type}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                >
                  <option value="message">Message</option>
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="event">Event</option>
                  <option value="coffee_chat">Coffee Chat</option>
                  <option value="introduction">Introduction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Date *</label>
                <input
                  className="input w-full"
                  type="date"
                  value={activityForm.activity_date}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  className="input w-full"
                  type="number"
                  value={activityForm.duration_minutes}
                  onChange={(e) => setActivityForm({ ...activityForm, duration_minutes: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select
                  className="input w-full"
                  value={activityForm.outcome}
                  onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                >
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                  <option value="no_response">No Response</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value Exchange</label>
                <select
                  className="input w-full"
                  value={activityForm.value_exchange}
                  onChange={(e) => setActivityForm({ ...activityForm, value_exchange: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="job_lead">Job Lead</option>
                  <option value="advice">Advice</option>
                  <option value="referral">Referral</option>
                  <option value="information">Information</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input w-full min-h-[100px]"
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  placeholder="What happened during this activity..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-outline" onClick={() => setActivityModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveActivity}>
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Add Networking Event</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                <input
                  className="input w-full"
                  value={eventForm.event_name}
                  onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                  placeholder="Tech Conference 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  className="input w-full"
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                >
                  <option value="conference">Conference</option>
                  <option value="meetup">Meetup</option>
                  <option value="workshop">Workshop</option>
                  <option value="webinar">Webinar</option>
                  <option value="networking_event">Networking Event</option>
                  <option value="career_fair">Career Fair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input
                  className="input w-full"
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                <input
                  className="input w-full"
                  type="number"
                  min="0"
                  step="0.01"
                  value={eventForm.cost}
                  onChange={(e) => setEventForm({ ...eventForm, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Invested (hours)</label>
                <input
                  className="input w-full"
                  type="number"
                  min="0"
                  step="0.5"
                  value={eventForm.time_invested_hours}
                  onChange={(e) => setEventForm({ ...eventForm, time_invested_hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leads Generated</label>
                <input
                  className="input w-full"
                  type="number"
                  min="0"
                  value={eventForm.leads_generated}
                  onChange={(e) => setEventForm({ ...eventForm, leads_generated: parseInt(e.target.value) || 0 })}
                  placeholder="Number of new contacts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opportunities Created</label>
                <input
                  className="input w-full"
                  type="number"
                  min="0"
                  value={eventForm.opportunities_created}
                  onChange={(e) => setEventForm({ ...eventForm, opportunities_created: parseInt(e.target.value) || 0 })}
                  placeholder="Job opportunities, partnerships, etc."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input w-full min-h-[100px]"
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  placeholder="Key takeaways, follow-ups, etc..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-outline" onClick={() => setEventModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEvent}>
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkingAnalytics;
