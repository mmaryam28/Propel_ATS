import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

export default function AcceptTeamInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      // Redirect to login with return URL
      localStorage.setItem('redirectAfterLogin', `/teams/invite/${token}`);
      navigate('/login');
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('token');
      
      // Get user's pending invitations to find this one
      const response = await axios.get(`${API}/teams/invitations/my-invitations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log('My invitations:', response.data);
      console.log('Looking for token:', token);

      const invite = response.data.find(inv => inv.token === token);
      
      console.log('Found invitation:', invite);
      
      if (!invite) {
        setError('Invitation not found or has expired.');
      } else {
        setInvitation(invite);
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const authToken = localStorage.getItem('token');
      
      console.log('About to accept invitation with token:', token);
      console.log('Invitation object:', invitation);
      
      const response = await axios.post(
        `${API}/teams/invitations/accept`,
        { token },
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('Invitation accepted:', response.data);

      // Clear redirect URL if it exists
      localStorage.removeItem('redirectAfterLogin');

      // Redirect to team page using the team_id from the response
      const teamId = response.data.team_id || invitation?.team_id;
      if (teamId) {
        navigate(`/teams/${teamId}/dashboard`);
      } else {
        navigate('/teams');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      const errorMessage = err.response?.data?.message || 'Failed to accept invitation';
      
      // If already a member, redirect them to the team
      if (errorMessage.includes('already a member')) {
        alert('You are already a member of this team. Redirecting...');
        const teamId = invitation?.teams?.id || invitation?.team_id;
        if (teamId) {
          navigate(`/teams/${teamId}/dashboard`);
        } else {
          navigate('/teams');
        }
      } else {
        alert(errorMessage);
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      const authToken = localStorage.getItem('token');
      
      await axios.post(
        `${API}/teams/invitations/${token}/decline`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      navigate('/teams');
    } catch (err) {
      console.error('Error declining invitation:', err);
      alert('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/teams')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
            <p className="text-gray-600">You've been invited to join a team!</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700">Team:</span>
                <span className="ml-2 text-gray-900">{invitation?.teams?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <span className="ml-2 text-gray-900 capitalize">{invitation?.role}</span>
              </div>
              {invitation?.teams?.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 text-sm mt-1">{invitation.teams.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">As a {invitation?.role}, you will be able to:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {invitation?.role === 'admin' && (
                <>
                  <li>✓ Manage team members and settings</li>
                  <li>✓ View all candidate profiles and progress</li>
                  <li>✓ Access team analytics and reports</li>
                  <li>✓ Invite new members to the team</li>
                </>
              )}
              {invitation?.role === 'mentor' && (
                <>
                  <li>✓ View all candidate profiles and progress</li>
                  <li>✓ Access team analytics and reports</li>
                  <li>✓ Provide guidance and feedback</li>
                </>
              )}
              {invitation?.role === 'candidate' && (
                <>
                  <li>✓ Access your job search dashboard</li>
                  <li>✓ Track your applications and progress</li>
                  <li>✓ Receive support from mentors</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              disabled={accepting}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            This invitation expires on {invitation && new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
