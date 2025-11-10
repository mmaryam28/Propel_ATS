import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon";

// Helper for className merging
const classNames = (...xs) => xs.filter(Boolean).join(" ");

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "home" },
  { to: "/jobs", label: "Jobs", icon: "job" },
  //{ to: "/applications", label: "Applications", icon: "applications" },
  { to: "/education", label: "Education", icon: "education" },
  { to: "/certifications", label: "Certifications", icon: "certifications" },
  { to: "/projects", label: "Projects", icon: "projects" },
  { to: "/skills", label: "Skills", icon: "brain" },
  { to: "/employment", label: "Employment", icon: "employment" },

];


// ---- Breadcrumbs component ----
function Breadcrumbs() {
  const location = useLocation();
  const [segments, setSegments] = useState([]);

  useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const acc = [];
    parts.forEach((p, idx) => {
      const href = "/" + parts.slice(0, idx + 1).join("/");
      const name = decodeURIComponent(p)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      acc.push({ name, href });
    });
    setSegments(acc);
  }, [location.pathname]);

  if (segments.length === 0) return null;

  return (
    <nav className="px-4 sm:px-6 lg:px-8 py-2" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        <li>
          <Link to="/" className="hover:text-gray-900">
            Home
          </Link>
        </li>
        {segments.map((seg, i) => (
          <li key={seg.href} className="flex items-center gap-2">
            <span aria-hidden>›</span>
            {i === segments.length - 1 ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {seg.name}
              </span>
            ) : (
              <Link to={seg.href} className="hover:text-gray-900">
                {seg.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---- Navbar component ----
function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // close mobile menu on Escape for better keyboard support
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
          {/* Left side: Logo + Nav */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="../public/propel-logo.png"
                alt="Propel logo"
                className="h-7 w-7 object-contain rounded-md hover:scale-105 transition-transform duration-200"
              />
              <span className="font-semibold whitespace-nowrap truncate max-w-[12ch] sm:max-w-none">PROPEL</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-1 ml-2" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    classNames(
                      "px-3 py-2 rounded-xl text-sm transition hover:bg-gray-100 flex items-center gap-2",
                      isActive
                        ? "bg-gray-900 text-white hover:bg-gray-900"
                        : "text-gray-700"
                    )
                  }
                  end
                >
                  <Icon name={item.icon} size="sm" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right side: Profile + Logout */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/profile"
              className="px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Icon name="profile" size="sm" />
              <span>Profile</span>
            </Link>
            <button
            onClick={() => {
                fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                .then(() => window.location.href = "/login");
            }}
            className="px-3 py-2 rounded-xl text-sm bg-gray-900 text-white hover:opacity-90 flex items-center gap-2"
            >
              <Icon name="logout" size="sm" variant="white" />
              <span>Logout</span>
            </button>

          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-gray-700 hover:bg-gray-100 touch target"
            aria-label="Open Menu"
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Open menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              {open ? (
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu panel */}
        {open && (
          <div id="mobile-menu" className="md:hidden pb-3" role="dialog" aria-modal="true" aria-label="Mobile menu">
            <nav className="flex flex-col gap-1" aria-label="Mobile Primary">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    classNames(
                    "px-3 py-2 rounded-xl text-sm transition w-full touch-target flex items-center gap-2",
                    isActive
                    ? "bg-gray-200 text-gray-900"    // dark text on light background
                    : "text-gray-700 hover:bg-gray-100"
     )
                  }
                  end
                >
                  <Icon name={item.icon} size="sm" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/profile"
                className="px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Icon name="profile" size="sm" />
                <span>Profile</span>
              </Link>
            <button
            onClick={() => {
                fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                .then(() => window.location.href = "/login");
            }}
            className="px-3 py-2 rounded-xl text-sm bg-gray-900 text-white hover:opacity-90 w-full text-center flex items-center gap-2 justify-center"
            >
              <Icon name="logout" size="sm" variant="white" />
              <span>Logout</span>
            </button>

            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ---- The layout wrapper that includes Navbar + Breadcrumbs ----
export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Catch token from OAuth callback redirect ?token=... and store.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      try {
        localStorage.setItem('token', token);
      } catch {}
      // Clean the URL by removing the token param
      const path = location.pathname + (Array.from(params.keys()).filter(k => k !== 'token').length ? '?' + Array.from(params.entries()).filter(([k]) => k !== 'token').map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '');
      navigate(path || '/dashboard', { replace: true });
    }
  }, [location.search]);

  return (
    <div className="min-h-screen w-full bg-gray-50">

      <Navbar />
      <Breadcrumbs />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-gray-900">
        <Outlet />
      </main>
    </div>
  );
}
