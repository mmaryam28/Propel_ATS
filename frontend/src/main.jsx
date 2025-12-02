import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { AnalyticsProvider } from './contexts/AnalyticsContext';

// Pages
import ProfileDashboard from './pages/ProfileDashboard.jsx';
import Jobs from './pages/Jobs';
import JobPipeline from './pages/JobPipeline.jsx';
import JobDetails from './pages/JobDetails';
import JobCalendar from './pages/JobCalendar';
import ArchivedJobs from './pages/ArchivedJobs';
import StatisticsPage from './pages/StatisticsPage';
import Applications from './pages/Applications';

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
import InterviewInsights from './pages/Resumes/InterviewInsights';
import InterviewPerformanceAnalytics from './pages/Prepare/InterviewPerformanceAnalytics';
import ApplicationSuccessAnalytics from './pages/Jobs/ApplicationSuccessAnalytics';
import GoalsDashboard from './pages/Goals/GoalsDashboard';
import MarketIntelligence from './pages/MarketIntelligence';
import CompetitiveAnalysis from './pages/Prepare/CompetitiveAnalysis';
import CustomReports from './pages/Prepare/CustomReports';
import ProductivityAnalytics from './pages/Jobs/ProductivityAnalytics';
import NetworkingAnalytics from './pages/Networking/NetworkingAnalytics';


import './index.css';
import './styles/globals.css';
import './styles/theme.css';

const TemplatesPage = lazy(() => import('./coverletters/pages/TemplatesPage'));

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

  // Authenticated app routes under layout
  {
    element: <AppLayout />, // navbar + breadcrumbs on every child route
    children: [
      { path: '/dashboard', element: <ProfileDashboard /> },
      { path: '/jobs', element: <Jobs /> },
      { path: '/jobs/pipeline', element: <JobPipeline /> },
      { path: '/jobs/calendar', element: <JobCalendar /> },
      { path: '/jobs/archived', element: <ArchivedJobs /> },
      { path: '/jobs/statistics', element: <StatisticsPage /> },
      { path: '/jobs/:jobId', element: <JobDetails /> },
      { path: '/applications', element: <Applications /> },
      // { path: '/documents', element: <Documents /> },
      { path: '/profile', element: <Profile /> },
      { path: '/education', element: <EducationPage /> },
      { path: '/certifications', element: <CertificationsPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/skills', element: <Skills /> },
      { path: '/employment', element: <EmploymentHistoryPage /> },
      { path: '/cards', element: <CardPreview /> },
      { path: '/typography', element: <TypographyPreview /> },
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
      { path: '/productivity-tracker', element: <ProductivityAnalytics /> },
      { path: '/network-analytics', element: <NetworkingAnalytics /> },


      // ✅ New Cover Letter Templates route
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnalyticsProvider>
      <RouterProvider router={router} />
    </AnalyticsProvider>
  </React.StrictMode>
);
