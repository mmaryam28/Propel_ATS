import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { 
  getGmailAuthUrl, 
  getGmailConnectionStatus, 
  disconnectGmail,
  searchEmails,
  linkEmailToJob,
  getLinkedEmails,
  unlinkEmail 
} from '../lib/api';

export default function EmailIntegration({ jobId, companyName, jobTitle }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState([]);
  const [linkedEmails, setLinkedEmails] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState('');
  const [nextPageToken, setNextPageToken] = useState(null);

  useEffect(() => {
    checkConnection();
    if (jobId) {
      loadLinkedEmails();
    }
  }, [jobId]);

  // Auto-populate search with company name
  useEffect(() => {
    if (companyName) {
      setSearchQuery(companyName);
    }
  }, [companyName]);

  async function checkConnection() {
    setLoading(true);
    try {
      const status = await getGmailConnectionStatus();
      setConnected(status.connected);
    } catch (err) {
      console.error('Error checking Gmail connection:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const { authUrl } = await getGmailAuthUrl();
      // Store current job ID to return to after OAuth
      if (jobId) {
        localStorage.setItem('gmail_return_job', jobId);
      }
      window.location.href = authUrl;
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to initiate Gmail connection');
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect your Gmail account? This will not delete linked emails.')) {
      return;
    }
    try {
      await disconnectGmail();
      setConnected(false);
      setEmails([]);
      setShowSearch(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to disconnect Gmail');
    }
  }

  async function handleSearch(loadMore = false) {
    setSearching(true);
    setError('');
    try {
      const result = await searchEmails(
        searchQuery,
        20,
        loadMore ? nextPageToken : undefined
      );
      
      if (loadMore) {
        setEmails([...emails, ...result.emails]);
      } else {
        setEmails(result.emails);
      }
      setNextPageToken(result.nextPageToken);
      setShowSearch(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to search emails');
    } finally {
      setSearching(false);
    }
  }

  async function loadLinkedEmails() {
    try {
      const linked = await getLinkedEmails(jobId);
      setLinkedEmails(linked);
    } catch (err) {
      console.error('Error loading linked emails:', err);
    }
  }

  async function handleLinkEmail(email) {
    try {
      await linkEmailToJob(jobId, email.id);
      await loadLinkedEmails();
      // Remove from search results
      setEmails(emails.filter(e => e.id !== email.id));
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to link email');
    }
  }

  async function handleUnlinkEmail(linkId) {
    if (!confirm('Remove this email from the job application?')) return;
    try {
      await unlinkEmail(linkId);
      await loadLinkedEmails();
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to unlink email');
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  function suggestStatus(email) {
    const text = `${email.subject} ${email.snippet}`.toLowerCase();
    
    if (text.match(/\b(interview|schedule|meeting|zoom|teams|call)\b/i)) {
      return { status: 'Interview', color: 'text-blue-600' };
    }
    if (text.match(/\b(offer|congratulations|welcome aboard|pleased to offer)\b/i)) {
      return { status: 'Offer', color: 'text-green-600' };
    }
    if (text.match(/\b(reject|regret|unfortunately|not moving forward|other candidates)\b/i)) {
      return { status: 'Rejected', color: 'text-red-600' };
    }
    if (text.match(/\b(application received|thank you for applying|reviewing)\b/i)) {
      return { status: 'Applied', color: 'text-yellow-600' };
    }
    
    return null;
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Icon name="loader" className="animate-spin mr-2" />
          <span>Loading email integration...</span>
        </div>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Icon name="mail" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Connect Gmail</h3>
          <p className="text-gray-600 mb-4">
            Link emails to your job applications to keep all communication in one place.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We only request read-only access and respect your privacy.
          </p>
          <button
            onClick={handleConnect}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Connect Gmail Account
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Linked Emails Section */}
      {linkedEmails.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Icon name="mail" className="mr-2" />
            Linked Emails ({linkedEmails.length})
          </h3>
          <div className="space-y-2">
            {linkedEmails.map((link) => {
              const suggestion = suggestStatus(link);
              return (
                <div
                  key={link.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {link.fromName || link.fromEmail}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(link.receivedDate)}
                        </span>
                        {suggestion && (
                          <span className={`text-xs font-semibold ${suggestion.color}`}>
                            {suggestion.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                        {link.subject}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {link.snippet}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlinkEmail(link.id)}
                      className="ml-2 text-red-600 hover:text-red-700 p-1"
                      title="Remove email"
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Search Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Icon name="search" className="mr-2" />
            Search & Link Emails
          </h3>
          <button
            onClick={handleDisconnect}
            className="text-sm text-gray-600 hover:text-red-600 transition"
          >
            Disconnect Gmail
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search emails (e.g., "${companyName || 'company name'}")`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSearch()}
            disabled={searching || !searchQuery}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
          >
            {searching ? (
              <>
                <Icon name="loader" className="animate-spin mr-2 w-4 h-4" />
                Searching...
              </>
            ) : (
              <>
                <Icon name="search" className="mr-2 w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>

        {showSearch && (
          <div className="space-y-2">
            {emails.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No emails found. Try a different search term.
              </p>
            ) : (
              <>
                {emails.map((email) => {
                  const suggestion = suggestStatus(email);
                  return (
                    <div
                      key={email.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {email.fromName || email.fromEmail}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(email.receivedDate)}
                            </span>
                            {suggestion && (
                              <span className={`text-xs font-semibold ${suggestion.color}`}>
                                Suggests: {suggestion.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                            {email.subject}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {email.snippet}
                          </p>
                        </div>
                        <button
                          onClick={() => handleLinkEmail(email)}
                          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition whitespace-nowrap"
                        >
                          Link to Job
                        </button>
                      </div>
                    </div>
                  );
                })}
                {nextPageToken && (
                  <button
                    onClick={() => handleSearch(true)}
                    disabled={searching}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                  >
                    Load More
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
