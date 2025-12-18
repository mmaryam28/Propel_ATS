import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { AnalyticsProvider } from "./contexts/AnalyticsContext";
import ProtectedRoute from "./components/ProtectedRoute";

// UI & Demo Pages
import TypographyPreview from "./pages/TypographyPreview";
import IconDemo from "./components/ui/IconDemo";

// Public Pages
import Landing from "./pages/Landing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import DeleteAccount from "./pages/DeleteAccount";
import PasswordResetRequest from "./pages/PasswordResetRequest";
import PasswordResetComplete from "./pages/PasswordResetComplete";

// Dashboard + Profile Pages
import ProfileDashboard from "./pages/ProfileDashboard";
import EducationPage from "./pages/EducationPage";
import CertificationsPage from "./pages/CertificationsPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProfileForm from "./components/ProfileForm";
import ProfileSummary from "./components/ProfileSummary";

// Networking Pages
import ContactsPage from "./pages/networking/ContactsPage";
import ContactDetailPage from "./pages/networking/ContactDetailPage";
import EventsPage from "./pages/networking/EventsPage";
import InformationalInterviewsPage from "./pages/networking/InformationalInterviewsPage";
import MaintenancePage from "./pages/networking/MaintenancePage";

// Team Management Pages
import TeamManagement from "./pages/TeamManagement";
import TeamMembers from "./pages/TeamMembers";
import TeamDashboard from "./pages/TeamDashboard";

// Offers Pages
import Offers from "./pages/Offers";
import OfferComparison from "./pages/OfferComparison";

// Career Simulation Pages
import CareerSimulation from "./pages/CareerSimulation";
import SimulationDetail from "./pages/SimulationDetail";

const TemplatesPage = React.lazy(() =>
  import("./coverletters/pages/TemplatesPage")
);



export default function App() {
  return (
    <AnalyticsProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Password Reset + Auth */}
        <Route path="/reset-password" element={<PasswordResetRequest />} />
        <Route path="/reset-password/:token" element={<PasswordResetComplete />} />
        <Route path="/forgot-password" element={<PasswordResetRequest />} />
        <Route path="/reset/:token" element={<PasswordResetComplete />} />
        <Route path="/logout" element={<Logout />} />

        {/* Demo / Utility */}
        <Route path="/typography" element={<TypographyPreview />} />
        <Route path="/icons" element={<IconDemo />} />

        {/* Dashboard + Profile */}
        <Route path="/dashboard" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
        <Route path="/education" element={<ProtectedRoute><EducationPage /></ProtectedRoute>} />
        <Route path="/certifications" element={<ProtectedRoute><CertificationsPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />

        {/* Profile Completion */}
        <Route path="/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileForm /></ProtectedRoute>} />
        <Route path="/profile/summary" element={<ProtectedRoute><ProfileSummary /></ProtectedRoute>} />
        <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />

        {/* Networking */}
        <Route path="/networking/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
        <Route path="/networking/contacts/:id" element={<ProtectedRoute><ContactDetailPage /></ProtectedRoute>} />
        <Route path="/networking/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/networking/interviews" element={<ProtectedRoute><InformationalInterviewsPage /></ProtectedRoute>} />
        <Route path="/networking/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />

        {/* Team Management */}
        <Route path="/teams" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
        <Route path="/teams/:teamId/members" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
        <Route path="/teams/:teamId/dashboard" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />

        {/* Offers */}
        <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
        <Route path="/offers/compare" element={<ProtectedRoute><OfferComparison /></ProtectedRoute>} />

        {/* Career Simulation (UC-128) */}
        <Route path="/simulation" element={<ProtectedRoute><CareerSimulation /></ProtectedRoute>} />
        <Route path="/simulation/:id" element={<ProtectedRoute><SimulationDetail /></ProtectedRoute>} />

        <Route
          path="/coverletters/templates"
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<div>Loading templates…</div>}>
                <TemplatesPage />
              </React.Suspense>
            </ProtectedRoute>
          }
        />

        {/* Optional 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
    </AnalyticsProvider>
  );
}
