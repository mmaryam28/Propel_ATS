import { useState, useEffect } from 'react';
import Card from "../components/Card";
import GitHubConnect from '../components/github/GitHubConnect';
import RepositoryCard from '../components/github/RepositoryCard';
import { getGitHubRepositories, updateGitHubRepository } from '../lib/api';

export default function Projects() {
  const [activeTab, setActiveTab] = useState('manual');
  const [gitHubConnected, setGitHubConnected] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    if (gitHubConnected) {
      loadRepositories();
    }
  }, [gitHubConnected, showFeaturedOnly]);

  async function loadRepositories() {
    try {
      setLoading(true);
      const repos = await getGitHubRepositories(showFeaturedOnly ? true : undefined);
      setRepositories(repos);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeatureToggle(repoId, isFeatured) {
    try {
      await updateGitHubRepository(repoId, { is_featured: isFeatured });
      await loadRepositories(); // Refresh list
    } catch (error) {
      console.error('Failed to update repository:', error);
      alert('Failed to update repository. Please try again.');
    }
  }

  function handleConnectionChange(connection) {
    setGitHubConnected(!!connection);
    if (!connection) {
      setRepositories([]);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manual Projects
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'github'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          GitHub Repositories
        </button>
      </div>

      {/* Manual Projects Tab */}
      {activeTab === 'manual' && (
        <>
          <Card title="Add Project">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="form-label">Title</label>
                <input className="input" />
              </div>
              <div>
                <label className="form-label">Link</label>
                <input className="input" placeholder="https://…" />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Description</label>
                <textarea className="input" rows={4} />
              </div>
              <button className="btn btn-primary sm:col-span-2">Save</button>
            </form>
          </Card>

          <Card title="Your Projects">
            <p className="text-gray-600">No entries yet.</p>
          </Card>
        </>
      )}

      {/* GitHub Tab */}
      {activeTab === 'github' && (
        <>
          <Card title="GitHub Connection">
            <GitHubConnect onConnectionChange={handleConnectionChange} />
          </Card>

          {gitHubConnected && (
            <Card title="Your Repositories">
              {/* Filter Toggle */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => setShowFeaturedOnly(false)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    !showFeaturedOnly
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Repositories
                </button>
                <button
                  onClick={() => setShowFeaturedOnly(true)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    showFeaturedOnly
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Featured Only
                </button>
              </div>

              {/* Repository List */}
              {loading ? (
                <div className="text-center py-8 text-gray-600">Loading repositories...</div>
              ) : repositories.length > 0 ? (
                <div className="grid gap-4">
                  {repositories.map(repo => (
                    <RepositoryCard
                      key={repo.id}
                      repo={repo}
                      onFeatureToggle={handleFeatureToggle}
                      skills={repo.skills || []}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  {showFeaturedOnly 
                    ? 'No featured repositories yet. Feature some repositories to showcase them!' 
                    : 'No repositories found. Click "Sync" to import your GitHub repositories.'}
                </p>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
