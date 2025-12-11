import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute - Ensures only authenticated users can access protected pages
 * Redirects to /login if no token is found in localStorage
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    // No token means user is not authenticated - redirect to login
    return <Navigate to="/login" replace />;
  }

  // Token exists - render the protected component
  return children;
}
