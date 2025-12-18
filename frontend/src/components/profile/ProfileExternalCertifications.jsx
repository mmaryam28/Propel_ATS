import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card } from '../ui/Card';

const API = import.meta?.env?.VITE_API_URL || 'https://cs490-backend.onrender.com';

const PLATFORMS = {
  HackerRank: '💻',
  LeetCode: '🧩',
  Codecademy: '📚',
  Other: '🔧',
};

export default function ProfileExternalCertifications({ userId }) {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ProfileExternalCertifications - userId:', userId);
    
    if (!userId) {
      console.log('No userId provided, skipping fetch');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    console.log('Fetching external certifications for user:', userId);
    
    axios
      .get(`${API}/external-certifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('External certifications loaded:', res.data);
        setCertifications(res.data || []);
      })
      .catch((err) => {
        console.error('Error loading external certifications:', err);
        console.error('Error response:', err.response?.data);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <Card variant="default" size="large">
        <Card.Header>
          <Card.Title>External Certifications</Card.Title>
          <Card.Description>Your linked skill assessment platforms</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="h-20 animate-pulse rounded bg-gray-100" />
        </Card.Body>
      </Card>
    );
  }

  if (certifications.length === 0) {
    return (
      <Card variant="default" size="large">
        <Card.Header>
          <Card.Title>External Certifications</Card.Title>
          <Card.Description>Your linked skill assessment platforms</Card.Description>
        </Card.Header>
        <Card.Body>
          <p className="text-gray-500">— No external platforms linked yet</p>
        </Card.Body>
        <Card.Footer>
          <Link
            to="/certifications"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Link your first platform
          </Link>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card variant="default" size="large">
      <Card.Header>
        <Card.Title>External Certifications</Card.Title>
        <Card.Description>Your linked skill assessment platforms</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          {certifications.slice(0, 3).map((cert) => (
            <div
              key={cert.id}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{PLATFORMS[cert.platform] || '🔧'}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{cert.platform}</h4>
                    {cert.platform_username && (
                      <p className="text-xs text-gray-600">@{cert.platform_username}</p>
                    )}
                  </div>
                </div>
                <a
                  href={cert.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  View Profile →
                </a>
              </div>

              {/* Performance Metrics */}
              {(cert.overall_score || cert.overall_ranking || cert.percentile) && (
                <div className="bg-indigo-50 rounded p-2 mb-2">
                  <p className="text-xs font-semibold text-indigo-900 mb-1">Performance</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {cert.overall_score && (
                      <span className="text-gray-700">
                        Score: <strong>{cert.overall_score}</strong>
                      </span>
                    )}
                    {cert.overall_ranking && (
                      <span className="text-gray-700">
                        Rank: <strong>#{cert.overall_ranking.toLocaleString()}</strong>
                      </span>
                    )}
                    {cert.percentile && (
                      <span className="text-gray-700">
                        Top <strong>{cert.percentile}%</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Problem Solving */}
              {cert.total_problems_solved !== undefined && cert.total_problems_solved > 0 && (
                <div className="bg-green-50 rounded p-2">
                  <p className="text-xs font-semibold text-green-900 mb-1">Problems Solved</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-gray-700">
                      Total: <strong>{cert.total_problems_solved}</strong>
                    </span>
                    {cert.easy_problems_solved > 0 && (
                      <span className="text-green-600">
                        Easy: <strong>{cert.easy_problems_solved}</strong>
                      </span>
                    )}
                    {cert.medium_problems_solved > 0 && (
                      <span className="text-yellow-600">
                        Med: <strong>{cert.medium_problems_solved}</strong>
                      </span>
                    )}
                    {cert.hard_problems_solved > 0 && (
                      <span className="text-red-600">
                        Hard: <strong>{cert.hard_problems_solved}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Badges & Courses Count */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                <span>🏅 {cert.total_badges || cert.badges?.length || 0} badges</span>
                <span>📖 {cert.total_courses_completed || cert.courses?.length || 0} courses</span>
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
      <Card.Footer>
        <Link
          to="/certifications"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          View all external certifications
        </Link>
      </Card.Footer>
    </Card>
  );
}
