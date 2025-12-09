import { useState, useEffect } from 'react';
import { Github, RefreshCw, Unlink } from 'lucide-react';
import { 
  getGitHubConnection, 
  getGitHubAuthUrl, 
  disconnectGitHub, 
  syncGitHubRepositories 
} from '../../lib/api';

export default function GitHubConnect({ onConnectionChange }) {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadConnection();
  }, []);

  async function loadConnection() {
    try {
      setLoading(true);
      const conn = await getGitHubConnection();
      setConnection(conn);
      if (onConnectionChange) onConnectionChange(conn);
    } catch (error) {
      console.error('Failed to load GitHub connection:', error);
      setConnection(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const { url } = await getGitHubAuthUrl();
      // Open GitHub OAuth in same window
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get GitHub auth URL:', error);
      alert('Failed to start GitHub connection. Please try again.');
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect GitHub? This will remove all synced repositories.')) {
      return;
    }
    
    try {
      await disconnectGitHub();
      setConnection(null);
      if (onConnectionChange) onConnectionChange(null);
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
      alert('Failed to disconnect GitHub. Please try again.');
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await syncGitHubRepositories();
      await loadConnection(); // Refresh connection to get updated last_synced_at
      alert('Repositories synced successfully!');
    } catch (error) {
      console.error('Failed to sync repositories:', error);
      alert('Failed to sync repositories. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading GitHub connection...</span>
      </div>
    );
  }

  if (!connection) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Github className="w-5 h-5" />
        <span>Connect GitHub</span>
      </button>
    );
  }

  const lastSynced = connection.last_synced_at 
    ? new Date(connection.last_synced_at).toLocaleString()
    : 'Never';

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <img 
        src={connection.avatar_url} 
        alt={connection.username}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Github className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-gray-900">{connection.username}</span>
        </div>
        <p className="text-sm text-gray-600">Last synced: {lastSynced}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync'}</span>
        </button>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Unlink className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
