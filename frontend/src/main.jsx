import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { initAnalytics } from './lib/analytics';

// Pages
import ProfileDashboard from './pages/ProfileDashboard.jsx';
import Jobs from './pages/Jobs';
import JobPipeline from './pages/JobPipeline.jsx';
import JobDetails from './pages/JobDetails';
import JobCalendar from './pages/JobCalendar';
import JobMap from './pages/JobMap';
import ArchivedJobs from './pages/ArchivedJobs';
import StatisticsPage from './pages/StatisticsPage';
import Applications from './pages/Applications';
import MockInterviewSession from './pages/MockInterviewSession';

// import Documents from './pages/Documents';
import Profile from './pages/Profile';
import CardPreview from './pages/CardPreview';
import TypographyPreview from './pages/TypographyPreview';
import EducationPage from './pages/EducationPage';
import CertificationsPage from './pages/CertificationsPage';
import ProjectsPage from './pages/ProjectsPage';
import Skills from './pages/Skills';
import EmploymentHistoryPage from './pages/EmploymentHistory';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Logout from './pages/Logout';
import PasswordResetRequest from './pages/PasswordResetRequest';
import PasswordResetComplete from './pages/PasswordResetComplete';

// Resume pages (UC-046 – UC-054)
import ResumeDashboard from './pages/Resumes/ResumeDashboard.jsx';
import TemplateManager from './pages/Resumes/TemplateManager.jsx';
import AIResumeGenerator from './pages/Resumes/AIResumeGenerator.jsx';
import SectionCustomizer from './pages/Resumes/SectionCustomizer.jsx';
import VersionManager from './pages/Resumes/VersionManager.jsx';
import ResumePreview from './pages/Resumes/ResumePreview.jsx';
import FeedbackPanel from './pages/Resumes/FeedbackPanel.jsx';

// Job Search pages (moved under Resumes directory)
import CompanyResearch from './pages/Resumes/CompanyResearch';
import JobMatch from './pages/Resumes/JobMatch.jsx';
import SalaryAnalysis from './pages/Resumes/SalaryAnalysis';
import QualityCheck from './pages/QualityCheck';
import InterviewInsights from './pages/Resumes/InterviewInsights';
import InterviewPerformanceAnalytics from './pages/Prepare/InterviewPerformanceAnalytics';
import ApplicationSuccessAnalytics from './pages/Jobs/ApplicationSuccessAnalytics';
import GoalsDashboard from './pages/Goals/GoalsDashboard';
import MarketIntelligence from './pages/MarketIntelligence';
import CompetitiveAnalysis from './pages/Prepare/CompetitiveAnalysis';
import CustomReports from './pages/Prepare/CustomReports';
import Forecasting from './pages/Prepare/Forecasting';
import ProductivityAnalytics from './pages/Jobs/ProductivityAnalytics';
import NetworkingAnalytics from './pages/Networking/NetworkingAnalytics';
import SuccessPatterns from './pages/Analytics/SuccessPatterns';
import AnalyticsDashboard from './pages/AnalyticsDashboard';


// Networking pages
import ContactsPage from './pages/networking/ContactsPage';
import ContactDetailPage from './pages/networking/ContactDetailPage';
import ReferralsPage from './pages/networking/ReferralsPage';
import ReferencesPage from './pages/networking/ReferencesPage';
import EventsPage from './pages/networking/EventsPage';
import InformationalInterviewsPage from './pages/networking/InformationalInterviewsPage';
import MaintenancePage from './pages/networking/MaintenancePage';

// Mentorship pages
import Mentors from './pages/Mentors';
import MentorDashboard from './pages/MentorDashboard';

// Team Management pages
import TeamManagement from './pages/TeamManagement';
import TeamMembers from './pages/TeamMembers';
import TeamDashboard from './pages/TeamDashboard';
import AcceptTeamInvitation from './pages/AcceptTeamInvitation';
import GmailCallback from './pages/GmailCallback';
import TimingOptimizerPage from './pages/TimingOptimizerPage';
import SecurityDemo from './pages/SecurityDemo';
import AccessibilityDemo from './pages/AccessibilityDemo';

// Offers pages (UC-127)
import Offers from './pages/Offers';
import OfferComparison from './pages/OfferComparison';

// Responses pages (UC-126)
import ResponseLibrary from './pages/ResponseLibrary';
import PracticeMode from './pages/PracticeMode';
import ResponseAnalytics from './pages/ResponseAnalytics';

// Platform Tracking & Duplicates (UC-125)
import DuplicatesPage from './pages/DuplicatesPage';

// Career Simulation pages (UC-128)
import CareerSimulation from './pages/CareerSimulation';
import SimulationDetail from './pages/SimulationDetail';

import './index.css';
import './styles/globals.css';
import './styles/theme.css';

// Lazy load pages for better performance (UC-134)
const TemplatesPage = lazy(() => import('./coverletters/pages/TemplatesPage'));
const GeneratePage = lazy(() => import('./coverletters/pages/GeneratePage'));
const SavedCoverLettersPage = lazy(() => import('./coverletters/pages/SavedCoverLettersPage'));
const EditCoverLetterPage = lazy(() => import('./coverletters/pages/EditCoverLetterPage'));

// UC-014 color system tokens
// import "./CS490/UC-014/styles/colors.css";

const router = createBrowserRouter([
  // Public routes (no AppLayout)
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/terms', element: <Terms /> },
  { path: '/privacy', element: <Privacy /> },

  // Password reset (keep both legacy + new)
  { path: '/reset-password', element: <PasswordResetRequest /> }, // legacy
  { path: '/reset-password/:token', element: <PasswordResetComplete /> }, // legacy
  { path: '/forgot-password', element: <PasswordResetRequest /> }, // new
  { path: '/reset/:token', element: <PasswordResetComplete /> }, // new

  { path: '/logout', element: <Logout /> },
  { path: '/gmail-callback', element: <GmailCallback /> },

  // Authenticated app routes under layout
  {
    element: <AppLayout />, // navbar + breadcrumbs on every child route
    children: [
      { path: '/dashboard', element: <ProfileDashboard /> },
      { path: '/jobs', element: <Jobs /> },
      { path: '/jobs/duplicates', element: <DuplicatesPage /> },
      { path: '/jobs/pipeline', element: <JobPipeline /> },
      { path: '/jobs/calendar', element: <JobCalendar /> },
      { path: '/jobs/map', element: <JobMap /> },
      { path: '/jobs/archived', element: <ArchivedJobs /> },
      { path: '/jobs/statistics', element: <StatisticsPage /> },
      { path: '/jobs/:jobId', element: <JobDetails /> },
      { path: '/offers', element: <Offers /> },
      { path: '/offers/compare', element: <OfferComparison /> },
      { path: '/simulation', element: <CareerSimulation /> },
      { path: '/simulation/:id', element: <SimulationDetail /> },
      { path: '/responses', element: <ResponseLibrary /> },
      { path: '/responses/practice/:id', element: <PracticeMode /> },
      { path: '/responses/analytics', element: <ResponseAnalytics /> },
      { path: '/applications', element: <Applications /> },
      { path: '/quality-check', element: <QualityCheck /> },
      { path: '/mock-interview/:interviewId', element: <MockInterviewSession /> },
      // { path: '/documents', element: <Documents /> },
      { path: '/profile', element: <Profile /> },
      { path: '/education', element: <EducationPage /> },
      { path: '/certifications', element: <CertificationsPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/skills', element: <Skills /> },
      { path: '/employment', element: <EmploymentHistoryPage /> },
      { path: '/cards', element: <CardPreview /> },
      { path: '/typography', element: <TypographyPreview /> },
      
      { path: '/security', element: <SecurityDemo /> }, // UC-135: Security demo
      { path: '/accessibility', element: <AccessibilityDemo /> }, // UC-144: Accessibility testing

      { path: '/resumes', element: <ResumeDashboard /> },
      { path: '/resumes/templates', element: <TemplateManager /> },
      { path: '/resumes/ai', element: <AIResumeGenerator /> },
      { path: '/resumes/customize', element: <SectionCustomizer /> },
      { path: '/resumes/versions', element: <VersionManager /> },
      { path: '/resumes/preview/:id', element: <ResumePreview /> },
      { path: '/resumes/feedback', element: <FeedbackPanel /> },
      { path: '/research', element: <CompanyResearch /> },
      { path: '/job-match', element: <JobMatch /> },
      { path: '/salary-analysis', element: <SalaryAnalysis /> },
      { path: '/resumes/interview-insights', element: <InterviewInsights /> },
      { path: '/interview-performance', element: <InterviewPerformanceAnalytics /> },
      { path: '/application-success', element: <ApplicationSuccessAnalytics /> },
      { path: '/goals', element: <GoalsDashboard /> },
      { path: '/market-intelligence', element: <MarketIntelligence /> },
      { path: '/prepare/competitive-analysis', element: <CompetitiveAnalysis /> },
      { path: '/prepare/custom-reports', element: <CustomReports /> },
      { path: '/prepare/forecasting', element: <Forecasting /> },
      { path: '/productivity-tracker', element: <ProductivityAnalytics /> },
      { path: '/network-analytics', element: <NetworkingAnalytics /> },
      { path: '/success-patterns', element: <SuccessPatterns /> },
      { path: '/analytics', element: <AnalyticsDashboard /> },
      { path: '/timing-optimizer', element: <TimingOptimizerPage /> },

      // Networking routes
      { path: '/networking/contacts', element: <ContactsPage /> },
      { path: '/networking/contacts/:id', element: <ContactDetailPage /> },
      { path: '/networking/referrals', element: <ReferralsPage /> },
      { path: '/networking/references', element: <ReferencesPage /> },
      { path: '/networking/events', element: <EventsPage /> },
      { path: '/networking/interviews', element: <InformationalInterviewsPage /> },
      { path: '/networking/maintenance', element: <MaintenancePage /> },
      
      // Mentorship routes
      { path: '/mentors', element: <Mentors /> },
      { path: '/mentor-dashboard', element: <MentorDashboard /> },
      { path: '/mentor-dashboard/:menteeId', element: <MentorDashboard /> },

      // Team Management routes
      { path: '/teams', element: <TeamManagement /> },
      { path: '/teams/:teamId/members', element: <TeamMembers /> },
      { path: '/teams/:teamId/dashboard', element: <TeamDashboard /> },
      { path: '/teams/invite/:token', element: <AcceptTeamInvitation /> },

      //New Cover Letter Templates route
      {
        path: '/coverletters',
        element: (
          <Suspense fallback={<div>Loading templates…</div>}>
            <TemplatesPage />
          </Suspense>
        ),
      },
      {
        path: '/coverletters/templates',
        element: (
          <Suspense fallback={<div>Loading templates…</div>}>
            <TemplatesPage />
          </Suspense>
        ),
      },
      {
        path: '/coverletters/generate',
        element: (
          <Suspense fallback={<div>Loading…</div>}>
            <GeneratePage />
          </Suspense>
        ),
      },
      {
        path: '/coverletters/saved',
        element: (
          <Suspense fallback={<div>Loading…</div>}>
            <SavedCoverLettersPage />
          </Suspense>
        ),
      },
      {
        path: '/coverletters/edit/:id',
        element: (
          <Suspense fallback={<div>Loading…</div>}>
            <EditCoverLetterPage />
          </Suspense>
        ),
      },
    ],
  },
]);

// Initialize PostHog analytics only if consent given
const consent = localStorage.getItem('cookie_consent');
if (consent === 'accepted') {
  initAnalytics();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnalyticsProvider>
      <RouterProvider router={router} />
    </AnalyticsProvider>
  </React.StrictMode>
);
