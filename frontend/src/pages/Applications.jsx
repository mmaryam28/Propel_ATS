import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";

// Demo data; swap for API results later
const APPLICATIONS = [
  { id: "a1", title: "Frontend Engineer", company: "Acme Inc.",   location: "Remote", appliedAt: "2025-02-02", status: "Applied" },
  { id: "a2", title: "Backend Engineer",  company: "Globex",      location: "NYC, NY", appliedAt: "2025-01-28", status: "Interview" },
  { id: "a3", title: "Full-stack Dev",    company: "Initech",     location: "Remote", appliedAt: "2025-01-22", status: "Rejected" },
  { id: "a4", title: "UI Engineer",       company: "Umbrella",    location: "Austin, TX", appliedAt: "2025-01-19", status: "Offer" },
];

// brand-colored status chip
function StatusBadge({ status }) {
  // Color mapping with fallbacks for missing theme vars
  const map = {
    Applied: {
      bg: "var(--accent-color, #42a5f5)",
      text: "#fff",
    },
    Interview: {
      bg: "var(--info-color, #29b6f6)",
      text: "#fff",
    },
    Offer: {
      bg: "var(--success-color, #4caf50)",
      text: "#fff",
    },
    Rejected: {
      bg: "var(--error-color, #e53935)",
      text: "#fff",
    },
  };

  const { bg, text } = map[status] || {
    bg: "var(--border-color, #e5e7eb)",
    text: "#111827",
  };

  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: bg,
        color: text,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
      }}
    >
      {status}
    </span>
  );
}


export default function Applications() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return APPLICATIONS.filter((a) => {
      const matchText =
        !term ||
        [a.title, a.company, a.location, a.status]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchStatus = status === "All" || a.status === status;
      return matchText && matchStatus;
    });
  }, [q, status]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Applications</h1>
          <p className="text-sm text-gray-600">Track all your submissions in one place.</p>
        </div>
        <Link
          to="/applications/new"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white
                     bg-[var(--primary-color)] hover:brightness-90"
        >
          <Icon name="plus" variant="white" />
          Add application
        </Link>
      </div>

      {/* Filters */}
      <Card variant="default">
        <Card.Body className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, title, location…"
              className="w-full rounded-lg border border-[var(--border-color)] bg-white pl-9 pr-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status" className="text-sm text-gray-600">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
            >
              {["All", "Applied", "Interview", "Offer", "Rejected"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </Card.Body>
      </Card>

      {/* Results meta */}
      <div className="text-sm text-gray-600">{results.length} result{results.length !== 1 ? "s" : ""}</div>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-lg border border-[var(--border-color)] md:block">
        <table className="min-w-full divide-y divide-[var(--border-color)]">
          <thead className="bg-[var(--panel-bg)]">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] bg-white">
            {results.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                <td className="px-4 py-3 text-gray-700">{a.company}</td>
                <td className="px-4 py-3 text-gray-700">{a.location}</td>
                <td className="px-4 py-3 text-gray-700">
                  {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/applications/${a.id}`}
                    className="text-sm font-medium text-[var(--primary-color)] hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="grid gap-3 md:hidden">
        {results.map((a) => (
          <Card key={a.id} to={`/applications/${a.id}`} variant="hover" className="space-y-2">
            <Card.Header className="flex items-center justify-between">
              <div>
                <Card.Title className="m-0">{a.title}</Card.Title>
                <Card.Description>{a.company}</Card.Description>
              </div>
              <StatusBadge status={a.status} />
            </Card.Header>
            <Card.Body className="text-sm text-gray-700">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-gray-100 px-2 py-1">{a.location}</span>
                <span className="rounded-md bg-gray-100 px-2 py-1">
                  {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </Card.Body>
            <Card.Footer>
              <span className="text-sm font-medium text-[var(--primary-color)]">View details →</span>
            </Card.Footer>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {results.length === 0 && (
        <Card variant="subtle" className="text-center">
          <Card.Body className="space-y-2">
            <div className="mx-auto w-10 rounded-lg bg-gray-100 p-2"><Icon name="applications" /></div>
            <Card.Title className="m-0">No applications found</Card.Title>
            <Card.Description>Try a different search or add a new application.</Card.Description>
            <div>
              <Link
                to="/applications/new"
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white
                           bg-[var(--primary-color)] hover:brightness-90"
              >
                <Icon name="plus" variant="white" />
                Add application
              </Link>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
