import { useState, useEffect } from 'react';
import { Star, GitFork, Eye, ExternalLink, Plus, X, Lock } from 'lucide-react';
import { listSkills } from '../../api/skills';
import { linkRepositoryToSkill, unlinkRepositoryFromSkill } from '../../lib/api';
import ContributionStats from './ContributionStats';

export default function RepositoryCard({ repo, onFeatureToggle, skills = [] }) {
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem('userId');
  const languages = repo.languages || {};
  const languageEntries = Object.entries(languages);
  const totalBytes = languageEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
  
  // Calculate percentages and get top 3 languages
  const topLanguages = languageEntries
    .map(([lang, bytes]) => ({
      name: lang,
      percentage: ((bytes / totalBytes) * 100).toFixed(1)
    }))
    .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
    .slice(0, 3);

  useEffect(() => {
    if (showSkillSelector && userId) {
      loadSkills();
    }
  }, [showSkillSelector, userId]);

  async function loadSkills() {
    try {
      setLoading(true);
      const allSkills = await listSkills(userId);
      
      // Get repository languages from the blue badges (e.g., "JavaScript", "HTML", "CSS")
      const repoLanguages = Object.keys(repo.languages || {});
      
      // Create skill options from repo languages
      // First, check if user already has these skills
      const skillOptions = repoLanguages.map(lang => {
        const existingSkill = allSkills.find(s => 
          s.name.toLowerCase().trim() === lang.toLowerCase().trim()
        );
        return existingSkill || { name: lang, id: null, isNew: true };
      });
      
      // Filter out skills already linked to this repo
      const linkedSkillNames = skills.map(s => s.name.toLowerCase());
      const unlinkedOptions = skillOptions.filter(opt => 
        !linkedSkillNames.includes(opt.name.toLowerCase())
      );
      
      setAvailableSkills(unlinkedOptions);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFeatureToggle = () => {
    if (onFeatureToggle) {
      onFeatureToggle(repo.id, !repo.is_featured);
    }
  };

  async function handleLinkSkill(skill) {
    try {
      let skillId = skill.id;
      
      // If it's a new skill (doesn't exist in user's profile), create it first
      if (skill.isNew) {
        const { createSkill } = await import('../../api/skills');
        const newSkill = await createSkill({
          userId,
          name: skill.name,
          category: 'Technical', // Default to Technical for programming languages
          proficiency: 'Intermediate', // Default proficiency
        });
        skillId = newSkill.id;
      }
      
      await linkRepositoryToSkill(repo.id, skillId);
      setShowSkillSelector(false);
      // Refresh parent component
      if (onFeatureToggle) {
        onFeatureToggle(repo.id, repo.is_featured); // Trigger refresh
      }
    } catch (error) {
      console.error('Failed to link skill:', error);
      alert('Failed to link skill. Please try again.');
    }
  }

  async function handleUnlinkSkill(skillId) {
    try {
      await unlinkRepositoryFromSkill(repo.id, skillId);
      // Trigger refresh
      if (onFeatureToggle) {
        onFeatureToggle(repo.id, repo.is_featured);
      }
    } catch (error) {
      console.error('Failed to unlink skill:', error);
      alert('Failed to unlink skill. Please try again.');
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <a 
              href={repo.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lg font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              {repo.name}
              <ExternalLink className="w-4 h-4" />
            </a>
            {repo.is_private && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded" title="Private repository">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>
          {repo.description && (
            <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
          )}
        </div>
        <button
          onClick={handleFeatureToggle}
          className={`ml-4 px-3 py-1 text-sm rounded-lg transition-colors ${
            repo.is_featured
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {repo.is_featured ? '⭐ Featured' : 'Feature'}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          <span>{repo.stars_count || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="w-4 h-4" />
          <span>{repo.forks_count || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{repo.watchers_count || 0}</span>
        </div>
      </div>

      {/* Languages */}
      {topLanguages.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-2 mb-1">
            {topLanguages.map(lang => (
              <span 
                key={lang.name}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
              >
                {lang.name} ({lang.percentage}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Linked Skills */}
      <div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map(skill => (
              <span 
                key={skill.id}
                className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded flex items-center gap-1"
              >
                {skill.name}
                <button
                  onClick={() => handleUnlinkSkill(skill.id)}
                  className="hover:text-green-900"
                  title="Remove skill"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Add Skill Button */}
        {!showSkillSelector ? (
          <button
            onClick={() => setShowSkillSelector(true)}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Link to Skill
          </button>
        ) : (
          <div className="p-2 bg-gray-50 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Select a skill</span>
              <button
                onClick={() => setShowSkillSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <p className="text-xs text-gray-500">Loading...</p>
            ) : availableSkills.length > 0 ? (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableSkills.map((skill, idx) => (
                  <button
                    key={skill.id || idx}
                    onClick={() => handleLinkSkill(skill)}
                    className="w-full text-left text-xs px-2 py-1 hover:bg-gray-100 rounded font-medium"
                  >
                    {!skill.isNew && <span className="text-green-600">★ </span>}
                    {skill.name} {skill.isNew && <span className="text-blue-600">(add & link)</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                All languages already linked!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contribution Statistics */}
      {(repo.total_commits > 0 || repo.commit_frequency?.length > 0 || repo.contributor_count > 0 || repo.last_commit_date) && (
        <ContributionStats repo={repo} />
      )}

      {/* Dates */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Created: {new Date(repo.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
