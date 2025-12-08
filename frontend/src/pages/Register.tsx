import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api"; // <-- use our axios instance
import AuthCard from "../components/AuthCard";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // basic client check to match backend rule
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const res = await api.post("/auth/register", {
        firstname: form.firstName,
        lastname: form.lastName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // UC-010: Store token and user data after successful registration
      if (res.data && res.data.token && res.data.user && res.data.user.id) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user.id);
      }

      navigate("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (status === 409) setError("Email already in use");
      else if (status === 400) {
        // backend validation errors can be an array or a string
        setError(Array.isArray(msg) ? msg[0] : msg || "Invalid input");
      } else {
        setError(msg || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

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

      <AuthCard title="Create your account">
        <form onSubmit={submit}>
          <input
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            name="firstName"
            required
          />
          <input
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            name="lastName"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            name="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            name="password"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            name="confirmPassword"
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Register"}
          </button>
          <div style={{ margin: '16px 0' }}>
            <button type="button" className="btn btn--oauth" onClick={() => window.location.href = '/auth/google'}>
              Sign up with Google
            </button>
            <button type="button" className="btn btn--oauth" onClick={() => window.location.href = '/auth/linkedin'}>
              Sign up with LinkedIn
            </button>
          </div>
          <p>
            <Link to="/login">Already have an account? Login →</Link>
          </p>
        </form>
      </AuthCard>
    </div>
  );
}
