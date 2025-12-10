import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  return window.localStorage.getItem('token');
}

const PLATFORMS = [
  { value: 'HackerRank', label: 'HackerRank', icon: '💻' },
  { value: 'LeetCode', label: 'LeetCode', icon: '🧩' },
  { value: 'Codecademy', label: 'Codecademy', icon: '📚' },
  { value: 'Other', label: 'Other', icon: '🔧' },
];

const VERIFICATION_STATUS_COLORS = {
  verified: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  manual: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

interface ExternalCertification {
  id: string;
  platform: string;
  platform_username?: string;
  profile_url: string;
  verification_status: 'verified' | 'pending' | 'manual' | 'failed';
  is_public: boolean;
  overall_score?: number;
  overall_ranking?: number;
  percentile?: number;
  total_problems_solved?: number;
  easy_problems_solved?: number;
  medium_problems_solved?: number;
  hard_problems_solved?: number;
  total_submissions?: number;
  acceptance_rate?: number;
  streak_days?: number;
  max_streak?: number;
  total_badges?: number;
  total_courses_completed?: number;
  scores?: any;
  ranking_data?: any;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  badges?: any[];
  courses?: any[];
}

interface Badge {
  id: string;
  badge_name: string;
  badge_type?: string;
  earned_date?: string;
  is_verified: boolean;
  verification_url?: string;
  badge_icon_url?: string;
}

interface Course {
  id: string;
  course_name: string;
  completion_date?: string;
  completion_percentage?: number;
  certificate_url?: string;
}

export default function ExternalCertificationsTab({ userId }: { userId: string }) {
  const [certifications, setCertifications] = useState<ExternalCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<ExternalCertification | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [linkForm, setLinkForm] = useState({
    platform: 'HackerRank',
    platformUsername: '',
    profileUrl: '',
    notes: '',
    isPublic: true,
    overallScore: '',
    overallRanking: '',
    percentile: '',
    totalProblemsSolved: '',
    easyProblemsSolved: '',
    mediumProblemsSolved: '',
    hardProblemsSolved: '',
    totalSubmissions: '',
    acceptanceRate: '',
    streakDays: '',
    maxStreak: '',
  });

  const [badgeForm, setBadgeForm] = useState({
    badgeName: '',
    badgeType: '',
    earnedDate: '',
    verificationUrl: '',
    description: '',
  });

  const [courseForm, setCourseForm] = useState({
    courseName: '',
    completionDate: '',
    completionPercentage: 100,
    certificateUrl: '',
  });

  useEffect(() => {
    if (userId) {
      loadCertifications();
    }
  }, [userId]);

  const loadCertifications = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API}/external-certifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCertifications(response.data || []);
    } catch (error) {
      console.error('Error loading external certifications:', error);
      setErrorMsg('Failed to load external certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const token = getToken();
      await axios.post(
        `${API}/external-certifications`,
        {
          userId,
          platform: linkForm.platform,
          platformUsername: linkForm.platformUsername,
          profileUrl: linkForm.profileUrl,
          notes: linkForm.notes,
          isPublic: linkForm.isPublic,
          verificationStatus: 'manual',
          overallScore: linkForm.overallScore ? parseInt(linkForm.overallScore) : undefined,
          overallRanking: linkForm.overallRanking ? parseInt(linkForm.overallRanking) : undefined,
          percentile: linkForm.percentile ? parseFloat(linkForm.percentile) : undefined,
          totalProblemsSolved: linkForm.totalProblemsSolved ? parseInt(linkForm.totalProblemsSolved) : undefined,
          easyProblemsSolved: linkForm.easyProblemsSolved ? parseInt(linkForm.easyProblemsSolved) : undefined,
          mediumProblemsSolved: linkForm.mediumProblemsSolved ? parseInt(linkForm.mediumProblemsSolved) : undefined,
          hardProblemsSolved: linkForm.hardProblemsSolved ? parseInt(linkForm.hardProblemsSolved) : undefined,
          totalSubmissions: linkForm.totalSubmissions ? parseInt(linkForm.totalSubmissions) : undefined,
          acceptanceRate: linkForm.acceptanceRate ? parseFloat(linkForm.acceptanceRate) : undefined,
          streakDays: linkForm.streakDays ? parseInt(linkForm.streakDays) : undefined,
          maxStreak: linkForm.maxStreak ? parseInt(linkForm.maxStreak) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowAddModal(false);
      setLinkForm({
        platform: 'HackerRank',
        platformUsername: '',
        profileUrl: '',
        notes: '',
        isPublic: true,
        overallScore: '',
        overallRanking: '',
        percentile: '',
        totalProblemsSolved: '',
        easyProblemsSolved: '',
        mediumProblemsSolved: '',
        hardProblemsSolved: '',
        totalSubmissions: '',
        acceptanceRate: '',
        streakDays: '',
        maxStreak: '',
      });
      loadCertifications();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Failed to link platform');
    }
  };

  const handleUnlink = async (id: string) => {
    if (!confirm('Are you sure you want to unlink this platform?')) return;

    try {
      const token = getToken();
      await axios.delete(`${API}/external-certifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadCertifications();
    } catch (error) {
      setErrorMsg('Failed to unlink platform');
    }
  };

  const handleSync = async (id: string) => {
    try {
      const token = getToken();
      await axios.post(
        `${API}/external-certifications/${id}/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadCertifications();
    } catch (error) {
      setErrorMsg('Failed to sync certification');
    }
  };

  const handleAddBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert) return;

    try {
      const token = getToken();
      await axios.post(
        `${API}/external-certifications/badges`,
        {
          externalCertificationId: selectedCert.id,
          badgeName: badgeForm.badgeName,
          badgeType: badgeForm.badgeType,
          earnedDate: badgeForm.earnedDate || null,
          verificationUrl: badgeForm.verificationUrl,
          description: badgeForm.description,
          isVerified: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowBadgeModal(false);
      setBadgeForm({
        badgeName: '',
        badgeType: '',
        earnedDate: '',
        verificationUrl: '',
        description: '',
      });
      loadCertifications();
    } catch (error) {
      setErrorMsg('Failed to add badge');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert) return;

    try {
      const token = getToken();
      await axios.post(
        `${API}/external-certifications/courses`,
        {
          externalCertificationId: selectedCert.id,
          courseName: courseForm.courseName,
          completionDate: courseForm.completionDate || null,
          completionPercentage: courseForm.completionPercentage,
          certificateUrl: courseForm.certificateUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowCourseModal(false);
      setCourseForm({
        courseName: '',
        completionDate: '',
        completionPercentage: 100,
        certificateUrl: '',
      });
      loadCertifications();
    } catch (error) {
      setErrorMsg('Failed to add course');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading external certifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">External Platform Certifications</h3>
          <p className="text-sm text-gray-600">
            Link your HackerRank, LeetCode, and Codecademy profiles to showcase your skills
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <span>+</span>
          Link Platform
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-2 text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Certifications List */}
      {certifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No external platforms linked yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-indigo-600 hover:underline"
          >
            Link your first platform
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              {/* Platform Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {PLATFORMS.find((p) => p.value === cert.platform)?.icon || '🔧'}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{cert.platform}</h4>
                    {cert.platform_username && (
                      <p className="text-sm text-gray-600">@{cert.platform_username}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    VERIFICATION_STATUS_COLORS[cert.verification_status]
                  }`}
                >
                  {cert.verification_status}
                </span>
              </div>

              {/* Profile Link */}
              <a
                href={cert.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline block mb-3"
              >
                View Profile →
              </a>

              {/* Scores and Rankings */}
              {(cert.overall_score || cert.overall_ranking || cert.percentile) && (
                <div className="bg-indigo-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-indigo-900 mb-2">Performance Metrics</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {cert.overall_score && (
                      <div>
                        <span className="text-gray-600">Score:</span>
                        <span className="ml-1 font-semibold text-gray-900">{cert.overall_score}</span>
                      </div>
                    )}
                    {cert.overall_ranking && (
                      <div>
                        <span className="text-gray-600">Rank:</span>
                        <span className="ml-1 font-semibold text-gray-900">#{cert.overall_ranking}</span>
                      </div>
                    )}
                    {cert.percentile && (
                      <div>
                        <span className="text-gray-600">Percentile:</span>
                        <span className="ml-1 font-semibold text-gray-900">{cert.percentile}%</span>
                      </div>
                    )}
                    {cert.acceptance_rate && (
                      <div>
                        <span className="text-gray-600">Accept Rate:</span>
                        <span className="ml-1 font-semibold text-gray-900">{cert.acceptance_rate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Problem Solving Stats */}
              {(cert.total_problems_solved || cert.streak_days) && (
                <div className="bg-green-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-green-900 mb-2">Problem Solving</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {cert.total_problems_solved !== undefined && cert.total_problems_solved > 0 && (
                      <div>
                        <span className="text-gray-600">Total Solved:</span>
                        <span className="ml-1 font-semibold text-gray-900">{cert.total_problems_solved}</span>
                      </div>
                    )}
                    {cert.easy_problems_solved !== undefined && cert.easy_problems_solved > 0 && (
                      <div>
                        <span className="text-gray-600">Easy:</span>
                        <span className="ml-1 font-semibold text-green-600">{cert.easy_problems_solved}</span>
                      </div>
                    )}
                    {cert.medium_problems_solved !== undefined && cert.medium_problems_solved > 0 && (
                      <div>
                        <span className="text-gray-600">Medium:</span>
                        <span className="ml-1 font-semibold text-yellow-600">{cert.medium_problems_solved}</span>
                      </div>
                    )}
                    {cert.hard_problems_solved !== undefined && cert.hard_problems_solved > 0 && (
                      <div>
                        <span className="text-gray-600">Hard:</span>
                        <span className="ml-1 font-semibold text-red-600">{cert.hard_problems_solved}</span>
                      </div>
                    )}
                    {cert.streak_days !== undefined && cert.streak_days > 0 && (
                      <div>
                        <span className="text-gray-600">Streak:</span>
                        <span className="ml-1 font-semibold text-orange-600">🔥 {cert.streak_days} days</span>
                      </div>
                    )}
                    {cert.max_streak !== undefined && cert.max_streak > 0 && (
                      <div>
                        <span className="text-gray-600">Max Streak:</span>
                        <span className="ml-1 font-semibold text-gray-900">{cert.max_streak} days</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>🏅 {cert.total_badges || cert.badges?.length || 0} badges</span>
                <span>📖 {cert.total_courses_completed || cert.courses?.length || 0} courses</span>
              </div>

              {/* Badges */}
              {cert.badges && cert.badges.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Recent Badges:</p>
                  <div className="flex flex-wrap gap-1">
                    {cert.badges.slice(0, 3).map((badge: Badge) => (
                      <span
                        key={badge.id}
                        className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                        title={badge.badge_name}
                      >
                        {badge.badge_name.length > 20
                          ? badge.badge_name.slice(0, 20) + '...'
                          : badge.badge_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedCert(cert);
                    setShowBadgeModal(true);
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Add Badge
                </button>
                <button
                  onClick={() => {
                    setSelectedCert(cert);
                    setShowCourseModal(true);
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Add Course
                </button>
                <button
                  onClick={() => handleSync(cert.id)}
                  className="text-xs text-gray-600 hover:underline"
                >
                  Sync
                </button>
                <button
                  onClick={() => handleUnlink(cert.id)}
                  className="text-xs text-red-600 hover:underline ml-auto"
                >
                  Unlink
                </button>
              </div>

              {cert.last_synced_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Last synced: {new Date(cert.last_synced_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-white pb-2">Link External Platform</h3>
            <form onSubmit={handleLinkPlatform} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={linkForm.platform}
                  onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={linkForm.platformUsername}
                  onChange={(e) => setLinkForm({ ...linkForm, platformUsername: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="your_username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={linkForm.profileUrl}
                  onChange={(e) => setLinkForm({ ...linkForm, profileUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={linkForm.notes}
                  onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Scores and Rankings Section */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Performance Metrics (Optional)</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Overall Score</label>
                    <input
                      type="number"
                      value={linkForm.overallScore}
                      onChange={(e) => setLinkForm({ ...linkForm, overallScore: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 2500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Global Ranking</label>
                    <input
                      type="number"
                      value={linkForm.overallRanking}
                      onChange={(e) => setLinkForm({ ...linkForm, overallRanking: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 1234"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Percentile</label>
                    <input
                      type="number"
                      step="0.01"
                      value={linkForm.percentile}
                      onChange={(e) => setLinkForm({ ...linkForm, percentile: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 95.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Acceptance Rate %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={linkForm.acceptanceRate}
                      onChange={(e) => setLinkForm({ ...linkForm, acceptanceRate: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 78.5"
                    />
                  </div>
                </div>

                <p className="text-sm font-semibold text-gray-700 mt-4 mb-3">Problem Solving Stats</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Problems</label>
                    <input
                      type="number"
                      value={linkForm.totalProblemsSolved}
                      onChange={(e) => setLinkForm({ ...linkForm, totalProblemsSolved: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Easy</label>
                    <input
                      type="number"
                      value={linkForm.easyProblemsSolved}
                      onChange={(e) => setLinkForm({ ...linkForm, easyProblemsSolved: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Medium</label>
                    <input
                      type="number"
                      value={linkForm.mediumProblemsSolved}
                      onChange={(e) => setLinkForm({ ...linkForm, mediumProblemsSolved: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 250"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hard</label>
                    <input
                      type="number"
                      value={linkForm.hardProblemsSolved}
                      onChange={(e) => setLinkForm({ ...linkForm, hardProblemsSolved: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Current Streak</label>
                    <input
                      type="number"
                      value={linkForm.streakDays}
                      onChange={(e) => setLinkForm({ ...linkForm, streakDays: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Streak</label>
                    <input
                      type="number"
                      value={linkForm.maxStreak}
                      onChange={(e) => setLinkForm({ ...linkForm, maxStreak: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={linkForm.isPublic}
                  onChange={(e) => setLinkForm({ ...linkForm, isPublic: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make profile public
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Link Platform
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Badge Modal */}
      {showBadgeModal && selectedCert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Badge - {selectedCert.platform}
            </h3>
            <form onSubmit={handleAddBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={badgeForm.badgeName}
                  onChange={(e) => setBadgeForm({ ...badgeForm, badgeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Type
                </label>
                <input
                  type="text"
                  value={badgeForm.badgeType}
                  onChange={(e) => setBadgeForm({ ...badgeForm, badgeType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., skill, achievement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Earned Date
                </label>
                <input
                  type="date"
                  value={badgeForm.earnedDate}
                  onChange={(e) => setBadgeForm({ ...badgeForm, earnedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification URL
                </label>
                <input
                  type="url"
                  value={badgeForm.verificationUrl}
                  onChange={(e) => setBadgeForm({ ...badgeForm, verificationUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBadgeModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Add Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && selectedCert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Course - {selectedCert.platform}
            </h3>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseForm.courseName}
                  onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={courseForm.completionDate}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, completionDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={courseForm.completionPercentage}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, completionPercentage: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate URL
                </label>
                <input
                  type="url"
                  value={courseForm.certificateUrl}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, certificateUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
