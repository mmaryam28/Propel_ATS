import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon";

const classNames = (...xs) => xs.filter(Boolean).join(" ");

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "home" },
];

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
          <Link to="/" className="hover:text-gray-900">Home</Link>
        </li>
        {segments.map((seg, i) => (
          <li key={seg.href} className="flex items-center gap-2">
            <span aria-hidden>›</span>
            {i === segments.length - 1 ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {seg.name}
              </span>
            ) : (
              <Link to={seg.href} className="hover:text-gray-900">{seg.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // Profile dropdown
  const [jobsOpen, setJobsOpen] = useState(false); // Jobs dropdown
  const [prepareOpen, setPrepareOpen] = useState(false); // Prepare dropdown
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Left side: Logo + Nav */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="../public/propel-logo.png"
                alt="Propel logo"
                className="h-7 w-7 object-contain rounded-md hover:scale-105 transition-transform duration-200"
              />
              <span className="font-semibold whitespace-nowrap">
                PROPEL
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-1 ml-1" aria-label="Primary">
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

              {/* Goals Link */}
              <NavLink
                to="/goals"
                className={({ isActive }) =>
                  classNames(
                    "px-3 py-2 rounded-xl text-sm transition hover:bg-gray-100 flex items-center gap-2",
                    isActive
                      ? "bg-gray-900 text-white hover:bg-gray-900"
                      : "text-gray-700"
                  )
                }
              >
                <Icon name="target" size="sm" />
                <span>Goals</span>
              </NavLink>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className={classNames(
                    "px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition",
                    profileOpen ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon name="profile" size="sm" />
                  <span>Profile</span>
                  <svg
                    className={classNames(
                      "h-3 w-3 transition-transform",
                      profileOpen ? "rotate-180" : ""
                    )}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute top-full mt-1 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-md py-2 z-50">
                    <Link to="/profile" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Profile Overview</Link>
                    <Link to="/education" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Education</Link>
                    <Link to="/certifications" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Certifications</Link>
                    <Link to="/projects" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Projects</Link>
                    <Link to="/skills" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Skills</Link>
                    <Link to="/employment" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Employment</Link>
                  </div>
                )}
              </div>

              {/* Jobs Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setJobsOpen((v) => !v)}
                  className={classNames(
                    "px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition",
                    jobsOpen ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon name="job" size="sm" />
                  <span>Jobs</span>
                  <svg
                    className={classNames(
                      "h-3 w-3 transition-transform",
                      jobsOpen ? "rotate-180" : ""
                    )}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {jobsOpen && (
                  <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-md py-2 z-50">
                    <Link to="/jobs" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Job Tracker</Link>
                    <Link to="/jobs/calendar" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Calendar</Link>
                    <Link to="/application-success" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Application Analytics</Link>
                    <Link to="/productivity-tracker" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Productivity Tracker</Link>
                    <Link to="/resumes" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Resumes</Link>
                    <Link to="/coverletters/templates" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Cover Letters</Link>
                  </div>
                )}
              </div>

              {/* ⚡ Prepare Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setPrepareOpen((v) => !v)}
                  className={classNames(
                    "px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition",
                    prepareOpen ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon name="search" size="sm" />
                  <span>Prepare</span>
                  <svg
                    className={classNames(
                      "h-3 w-3 transition-transform",
                      prepareOpen ? "rotate-180" : ""
                    )}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {prepareOpen && (
                  <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-md py-2 z-50">
                    <Link to="/research" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Company Research</Link>
                    <Link to="/salary-analysis" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Salary Analysis</Link>
                    <Link to="/resumes/interview-insights" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Interview Insights</Link>
                    <Link to="/interview-performance" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Performance Analytics</Link>
                    <Link to="/job-match" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Job Match</Link>
                    <Link to="/market-intelligence" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Market Intelligence</Link>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                  .then(() => (window.location.href = "/login"));
              }}
              className="px-3 py-2 rounded-xl text-sm bg-gray-900 text-white hover:opacity-90 flex items-center gap-2"
            >
              <Icon name="logout" size="sm" variant="white" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Open Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              {open ? (
                <path fillRule="evenodd" d="M6 18L18 6M6 6l12 12" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M3 6h18M3 12h18M3 18h18" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>

        {/* ⚡ Mobile menu panel */}
        {open && (
          <div className="md:hidden pb-3">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    classNames(
                      "px-3 py-2 rounded-xl text-sm flex items-center gap-2",
                      isActive ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                    )
                  }
                  end
                >
                  <Icon name={item.icon} size="sm" />
                  <span>{item.label}</span>
                </NavLink>
              ))}

              {/* Goals Link - Mobile */}
              <NavLink
                to="/goals"
                className={({ isActive }) =>
                  classNames(
                    "px-3 py-2 rounded-xl text-sm flex items-center gap-2",
                    isActive ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  )
                }
              >
                <Icon name="target" size="sm" />
                <span>Goals</span>
              </NavLink>

              {/* Profile Collapsible menu */}
              <details>
                <summary className="px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                  <Icon name="profile" size="sm" />
                  <span>Profile</span>
                </summary>
                <div className="pl-6 flex flex-col">
                  <Link to="/profile" className="py-1 text-sm text-gray-700 hover:underline">Profile Overview</Link>
                  <Link to="/education" className="py-1 text-sm text-gray-700 hover:underline">Education</Link>
                  <Link to="/certifications" className="py-1 text-sm text-gray-700 hover:underline">Certifications</Link>
                  <Link to="/projects" className="py-1 text-sm text-gray-700 hover:underline">Projects</Link>
                  <Link to="/skills" className="py-1 text-sm text-gray-700 hover:underline">Skills</Link>
                  <Link to="/employment" className="py-1 text-sm text-gray-700 hover:underline">Employment</Link>
                </div>
              </details>

              {/* Jobs Collapsible menu */}
              <details>
                <summary className="px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                  <Icon name="job" size="sm" />
                  <span>Jobs</span>
                </summary>
                <div className="pl-6 flex flex-col">
                  <Link to="/jobs" className="py-1 text-sm text-gray-700 hover:underline">Job Tracker</Link>
                  <Link to="/jobs/calendar" className="py-1 text-sm text-gray-700 hover:underline">Calendar</Link>
                  <Link to="/application-success" className="py-1 text-sm text-gray-700 hover:underline">Application Analytics</Link>
                  <Link to="/productivity-tracker" className="py-1 text-sm text-gray-700 hover:underline">Productivity Tracker</Link>
                  <Link to="/resumes" className="py-1 text-sm text-gray-700 hover:underline">Resumes</Link>
                  <Link to="/coverletters/templates" className="py-1 text-sm text-gray-700 hover:underline">Cover Letters</Link>
                </div>
              </details>

              {/* ⚡ Collapsible Prepare menu */}
              <details>
                <summary className="px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                  <Icon name="search" size="sm" />
                  <span>Prepare</span>
                </summary>
                <div className="pl-6 flex flex-col">
                  <Link to="/research" className="py-1 text-sm text-gray-700 hover:underline">Company Research</Link>
                  <Link to="/salary-analysis" className="py-1 text-sm text-gray-700 hover:underline">Salary Analysis</Link>
                  <Link to="/resumes/interview-insights" className="py-1 text-sm text-gray-700 hover:underline">Interview Insights</Link>
                  <Link to="/interview-performance" className="py-1 text-sm text-gray-700 hover:underline">Performance Analytics</Link>
                  <Link to="/job-match" className="py-1 text-sm text-gray-700 hover:underline">Job Match</Link>
                  <Link to="/market-intelligence" className="py-1 text-sm text-gray-700 hover:underline">Market Intelligence</Link>
                </div>
              </details>
            </nav>

            <div className="mt-2">
              <button
                onClick={() => {
                  fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                    .then(() => (window.location.href = "/login"));
                }}
                className="px-3 py-2 rounded-xl text-sm bg-gray-900 text-white hover:opacity-90 flex items-center justify-center gap-2"
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

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      try {
        localStorage.setItem("token", token);
      } catch {}
      const path =
        location.pathname +
        (Array.from(params.keys()).filter((k) => k !== "token").length
          ? "?" +
            Array.from(params.entries())
              .filter(([k]) => k !== "token")
              .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
              .join("&")
          : "");
      navigate(path || "/dashboard", { replace: true });
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
