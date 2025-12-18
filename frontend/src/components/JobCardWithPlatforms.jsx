import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';
import AddPlatformModal from '../components/AddPlatformModal';

const platformColors = {
  linkedin: 'bg-blue-100 text-blue-700',
  indeed: 'bg-green-100 text-green-700',
  glassdoor: 'bg-teal-100 text-teal-700',
  ziprecruiter: 'bg-purple-100 text-purple-700',
  monster: 'bg-pink-100 text-pink-700',
  careerbuilder: 'bg-orange-100 text-orange-700',
  dice: 'bg-red-100 text-red-700',
  company_site: 'bg-gray-100 text-gray-700',
  handshake: 'bg-indigo-100 text-indigo-700',
  angellist: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
};

const platformLabels = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
  ziprecruiter: 'ZipRecruiter',
  monster: 'Monster',
  careerbuilder: 'CareerBuilder',
  dice: 'Dice',
  company_site: 'Company Site',
  handshake: 'Handshake',
  angellist: 'AngelList',
  other: 'Other',
};

function JobCardWithPlatforms({ 
  job, 
  isSelected, 
  onToggleSelect, 
  searchTerm, 
  getDeadlineInfo, 
  highlightText,
  onPlatformsUpdated 
}) {
  const [platforms, setPlatforms] = useState([]);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);

  useEffect(() => {
    fetchPlatforms();
  }, [job.id]);

  const fetchPlatforms = async () => {
    setLoadingPlatforms(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/platforms/job/${job.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data);
      }
    } catch (error) {
      console.error('Error fetching platforms:', error);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  const handlePlatformAdded = (newPlatform) => {
    setPlatforms([...platforms, newPlatform]);
    if (onPlatformsUpdated) {
      onPlatformsUpdated();
    }
  };

  const deadlineInfo = getDeadlineInfo(job.deadline);

  return (
    <>
      <div className={`page-card p-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(job.id)}
              className="mt-1 w-4 h-4"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1">
              <Link 
                to={`/jobs/${job.id}`} 
                className="text-base font-semibold text-[var(--primary-color)] hover:underline"
              >
                {highlightText(job.title, searchTerm)}
              </Link>
              <div className="text-sm text-gray-600">
                {highlightText(job.company, searchTerm)}
              </div>
            </div>
          </div>
          {deadlineInfo && (
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs rounded-md px-2 py-1 font-medium ${deadlineInfo.urgencyClass}`}>
                {deadlineInfo.text}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(job.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Platform Badges */}
        {platforms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                  platformColors[platform.platform] || platformColors.other
                }`}
              >
                <span>{platformLabels[platform.platform] || 'Other'}</span>
                {platform.application_url && (
                  <a
                    href={platform.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:opacity-70"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {job.location && (
            <span className="rounded-md bg-gray-100 px-2 py-1">{job.location}</span>
          )}
          {job.jobType && (
            <span className="rounded-md bg-gray-100 px-2 py-1">{job.jobType}</span>
          )}
          {job.industry && (
            <span className="rounded-md bg-gray-100 px-2 py-1">{job.industry}</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {job.postingUrl && (
            <a
              className="inline-block text-sm font-medium text-[var(--primary-color)]"
              href={job.postingUrl}
              target="_blank"
              rel="noreferrer"
            >
              View posting →
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddPlatform(true);
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus size={14} />
            Add Platform
          </button>
        </div>
      </div>

      <AddPlatformModal
        isOpen={showAddPlatform}
        onClose={() => setShowAddPlatform(false)}
        job={job}
        onPlatformAdded={handlePlatformAdded}
      />
    </>
  );
}

export default JobCardWithPlatforms;
