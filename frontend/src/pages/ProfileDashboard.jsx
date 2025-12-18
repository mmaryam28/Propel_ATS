import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Container, Section } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import UpcomingDeadlinesWidget from '../components/UpcomingDeadlinesWidget';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ProfileCompletenessWidget from '../components/profile/ProfileCompletenessWidget';
import ProfileExternalCertifications from '../components/profile/ProfileExternalCertifications';

const API = import.meta?.env?.VITE_API_URL || 'https://cs490-backend.onrender.com';

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
}

const StatCard = ({ title, count = 0, to, icon }) => (
  <Card variant="hover" size="large" className="flex flex-col gap-3 w-full" role="article" aria-label={`${title} statistics`}>
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-gray-100 p-2" aria-hidden="true">{icon}</div>
      <Card.Title className="m-0 text-base sm:text-lg">{title}</Card.Title>
    </div>
    <Card.Body>
      <p className="text-3xl font-semibold" aria-label={`${count} ${title.toLowerCase()}`}>{count}</p>
      <Card.Footer className="mt-2">
        <Link
          to={to}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-900 bg-indigo-600 hover:bg-indigo-700"
          style={{ background: 'var(--primary-color, #4f46e5)' }}
          aria-label={`Quick add ${title.toLowerCase()}`}
        >
          <Icon name="plus" className="!h-4 !w-4 text-gray-900" variant="white" aria-hidden="true" />
          Quick add
        </Link>
      </Card.Footer>
    </Card.Body>
  </Card>
);

const EmptyLine = ({ text }) => <li className="text-gray-700">— {text}</li>;

export default function ProfileDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Extract userId from JWT token (it's stored as 'sub' in the JWT)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.sub || payload.userId); // Try 'sub' first, fallback to 'userId'
      } catch (err) {
        console.error('Failed to parse JWT token:', err);
      }
    }

    axios
      .get(`${API}/profile/overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then((res) => setOverview(res.data))
      .catch(() => setOverview({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container>
        <Section>
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </Section>
      </Container>
    );
  }

  const educList = overview?.recent?.education ?? [];
  const projList = overview?.recent?.projects ?? [];
  const summary = overview?.summary ?? {};
  const score = Math.min(100, Math.max(0, Math.round(overview?.completion?.score ?? 0)));

  return (
    <Container>
      {/* Page heading */}
      <Section className="pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile Overview</h1>
        <p className="mt-1 text-sm text-gray-700" id="dashboard-description">Keep your profile fresh to increase your match quality.</p>
      </Section>

      {/* Profile Completeness Widget */}
      <Section className="pt-0">
        <ProfileCompletenessWidget />
      </Section>

      {/* Upcoming Deadlines Widget */}
      <Section className="pt-0">
        <UpcomingDeadlinesWidget />
      </Section>

      {/* Analytics Dashboard */}
      <Section className="pt-0">
        <AnalyticsDashboard />
      </Section>

      {/* Stats */}
      <Section className="pt-0" aria-label="Profile statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="region" aria-label="Key metrics">
          <StatCard
            title="Education"
            count={summary.educationCount ?? 0}
            to="/education"
            icon={<Icon name="education" size="lg" />}
          />
          <StatCard
            title="Certifications"
            count={summary.certificationCount ?? 0}
            to="/certifications"
            icon={<Icon name="certifications" size="lg" />}
          />
          <StatCard
            title="Projects"
            count={summary.projectCount ?? 0}
            to="/projects"
            icon={<Icon name="projects" size="lg" />}
          />
        </div>
      </Section>

      {/* Recent lists */}
      <Section className="pt-0" aria-label="Recent activity">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="default" size="large" role="region" aria-label="Recent education entries">
            <Card.Header>
              <Card.Title>Recent Education</Card.Title>
              <Card.Description className="text-gray-700">Your latest entries</Card.Description>
            </Card.Header>
            <Card.Body>
              <ul className="space-y-2" role="list">
                {educList.length === 0 && <EmptyLine text="No education yet" />}
                {educList.map((e) => (
                  <li key={e.id} className="rounded-md border border-gray-200 p-3" role="listitem">
                    <div className="font-medium">{e.degree}</div>
                    <div className="text-sm text-gray-700">
                      {e.institution} · {fmtDate(e.startDate) ?? 'N/A'} — {fmtDate(e.endDate) ?? 'Ongoing'}
                    </div>
                  </li>
                ))}
              </ul>
            </Card.Body>
            <Card.Footer>
              <Link to="/education" className="text-sm font-medium text-indigo-700 hover:text-indigo-800 hover:underline" aria-label="Go to education management page">
                Manage education
              </Link>
            </Card.Footer>
          </Card>

          <Card variant="default" size="large" role="region" aria-label="Recent project entries">
            <Card.Header>
              <Card.Title>Recent Projects</Card.Title>
              <Card.Description className="text-gray-700">What you've been building</Card.Description>
            </Card.Header>
            <Card.Body>
              <ul className="space-y-2" role="list">
                {projList.length === 0 && <EmptyLine text="No projects yet" />}
                {projList.map((p) => (
                  <li key={p.id} className="rounded-md border border-gray-200 p-3" role="listitem">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-700">{p.status ?? 'Status unknown'}</div>
                  </li>
                ))}
              </ul>
            </Card.Body>
            <Card.Footer>
              <Link to="/projects" className="text-sm font-medium text-indigo-700 hover:text-indigo-800 hover:underline" aria-label="Go to projects management page">
                Manage projects
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </Section>

      {/* External Certifications */}
      <Section className="pt-0">
        <ProfileExternalCertifications userId={userId} />
      </Section>

      {/* Profile strength */}
      <Section className="pt-0" aria-label="Profile strength indicator">
        <Card variant="default" size="large" role="region" aria-label="Overall profile strength">
          <Card.Header>
            <Card.Title>Profile Strength</Card.Title>
            <Card.Description className="text-gray-700">
              Complete your profile to improve matching and ATS visibility.
            </Card.Description>
          </Card.Header>

          <Card.Body>
            <div className="space-y-2">
              <div className="relative w-full max-w-xl">
                <div className="h-3 w-full rounded-full bg-gray-100 ring-1 ring-inset" style={{ borderColor: 'var(--border-color, rgba(0,0,0,.08))' }} role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength progress" />
                <div
                  className="absolute inset-y-0 left-0 h-3 rounded-full transition-all"
                  style={{
                    width: `${score}%`,
                    background: 'var(--primary-color, #4f46e5)',
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-center justify-between max-w-xl text-sm">
                <span className="font-medium text-gray-900" aria-live="polite" aria-atomic="true">Profile is {score}% complete</span>
                <span className="text-gray-700" id="profile-strength-guidance" aria-live="polite">
                  {score < 50 && 'Add more education and at least one project to boost your profile.'}
                  {score >= 50 && score < 80 && 'Great start! Add certifications and project outcomes for a stronger profile.'}
                  {score >= 80 && 'Strong profile. Keep it up by keeping entries current.'}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Section>
    </Container>
  );
}