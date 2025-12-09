import { Activity, GitCommit, Users } from 'lucide-react';

export default function ContributionStats({ repo }) {
  const {
    total_commits = 0,
    commit_frequency = [],
    last_commit_date,
    contributor_count = 0,
  } = repo;

  // Calculate days since last commit
  const daysSinceLastCommit = last_commit_date
    ? Math.floor((Date.now() - new Date(last_commit_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Get activity level based on recent commits
  const recentCommits = commit_frequency.slice(-4).reduce((sum, week) => sum + week.commits, 0);
  const activityLevel = recentCommits > 20 ? 'High' : recentCommits > 5 ? 'Medium' : 'Low';
  const activityColor = recentCommits > 20 ? 'text-green-600' : recentCommits > 5 ? 'text-yellow-600' : 'text-gray-600';

  // Prepare data for mini bar chart (last 12 weeks)
  const maxCommits = Math.max(...commit_frequency.map(w => w.commits), 1);

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex items-center gap-1 mb-2 text-sm font-medium text-gray-700">
        <Activity className="w-4 h-4" />
        <span>Contribution Activity</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-1">
            <GitCommit className="w-3 h-3" />
            <span>Commits</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">{total_commits.toLocaleString()}</div>
          <div className="text-xs text-gray-500">past year</div>
        </div>

        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-1">
            <Users className="w-3 h-3" />
            <span>Contributors</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">{contributor_count}</div>
          <div className="text-xs text-gray-500">total</div>
        </div>

        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-600 mb-1">Activity</div>
          <div className={`text-lg font-semibold ${activityColor}`}>{activityLevel}</div>
          {daysSinceLastCommit !== null && (
            <div className="text-xs text-gray-500">
              {daysSinceLastCommit === 0 ? 'today' : `${daysSinceLastCommit}d ago`}
            </div>
          )}
        </div>
      </div>

      {/* Mini Commit Frequency Chart */}
      {commit_frequency.length > 0 && (
        <div>
          <div className="text-xs text-gray-600 mb-1">Weekly commits (last 12 weeks)</div>
          <div className="flex items-end gap-1 h-12">
            {commit_frequency.map((week, idx) => {
              const heightPercent = (week.commits / maxCommits) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-blue-200 hover:bg-blue-300 rounded-t transition-colors relative group cursor-pointer"
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                  title={`${week.commits} commits - ${new Date(week.week).toLocaleDateString()}`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {week.commits} commits
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {total_commits === 0 && (
        <p className="text-xs text-gray-500 italic text-center py-2">
          No commit activity data available
        </p>
      )}
    </div>
  );
}
