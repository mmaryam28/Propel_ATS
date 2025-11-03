import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

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

export default function App() {
  return (
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
        <Route path="/dashboard" element={<ProfileDashboard />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/certifications" element={<CertificationsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />

        {/* Profile Completion */}
        <Route path="/profile/edit" element={<ProfileForm />} />
        <Route path="/profile/summary" element={<ProfileSummary />} />
        <Route path="/delete-account" element={<DeleteAccount />} />

        {/* Optional 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
