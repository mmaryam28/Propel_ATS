import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { api } from "../lib/api";
import { identifyUser } from "../lib/analytics";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  //new line to force commit
  
  // Handle OAuth token from redirect
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (token) {
      // Store token and redirect to dashboard
      window.localStorage.setItem('token', token);
      // Extract userId from token (JWT payload)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) {
          window.localStorage.setItem('userId', payload.userId);
        }
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
      navigate('/dashboard');
    } else if (error) {
      setError(decodeURIComponent(error));
    }
  }, [searchParams, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Expect login response to include user object with id and token
      const res = await api.post("/auth/login", form);
      if (res.data && res.data.token && res.data.user && res.data.user.id) {
        window.localStorage.setItem('token', res.data.token);
        window.localStorage.setItem('userId', res.data.user.id);
        
        // UC-146: Identify user in analytics
        identifyUser(res.data.user.id, {
          email: res.data.user.email,
        });
        
        navigate("/dashboard");
      } else {
        setError("Login response missing token or user id");
      }
    } catch {
      setError("Invalid email or password");
    }
  };

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://cs490-backend.onrender.com';

  return (
    <div className="auth-page">
      <header className="lp-header container">
        <div className="lp-brand">
          <img src="/propel-logo.png" alt="Propel Logo" className="lp-logo" />
          <span className="lp-wordmark">Propel</span>
        </div>

        <nav className="lp-nav">
          <Link to="/login" className="lp-link">Login</Link>
          <Link to="/register" className="btn btn--primary">Get Started</Link>
        </nav>
      </header>

      <AuthCard title="Welcome Back">
        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <p className="error">{error}</p>}

          {/* NEW Forgot Password link */}
          <p style={{ marginTop: 8 }}>
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>

          <button type="submit">Sign In</button>

          <div style={{ margin: '16px 0' }}>
            <button
              type="button"
              className="btn btn--oauth"
              onClick={() => (window.location.href = `${API_BASE}/auth/google`)}
            >
              Sign in with Google
            </button>
            <button
              type="button"
              className="btn btn--oauth"
              onClick={() => (window.location.href = `${API_BASE}/auth/linkedin`)}
            >
              Sign in with LinkedIn
            </button>
          </div>

          <p>
            <Link to="/register">Create an account →</Link>
          </p>
        </form>
      </AuthCard>
    </div>
  );
}
