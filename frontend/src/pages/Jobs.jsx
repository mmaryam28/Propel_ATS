import React, { useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";

// demo data; replace with API later
const JOBS = [
  { id: "123", title: "Frontend Engineer", company: "Acme Inc.", location: "Remote (US)", type: "Full-time", postedAt: "2025-02-01" },
  { id: "456", title: "Backend Engineer",  company: "Globex",    location: "NYC, NY",     type: "Contract",  postedAt: "2025-01-20" },
];

export default function Jobs() {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return JOBS;
    return JOBS.filter(j =>
      [j.title, j.company, j.location, j.type].some(s => s.toLowerCase().includes(v))
    );
  }, [q]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-600">Browse open roles and view details.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, company, location…"
            className="w-full rounded-lg border border-[var(--border-color)] bg-white pl-9 pr-3 py-2 text-sm outline-none
                       focus:ring-2 focus:ring-[color:var(--primary-color)/0.25]"
          />
        </div>
      </div>

      {/* Results meta */}
      <div className="text-sm text-gray-600">{results.length} result{results.length !== 1 ? "s" : ""}</div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {results.map((j) => (
          <Card
            key={j.id}
            to={`/jobs/${j.id}`}
            variant="hover"
            size="large"
            className="flex flex-col gap-3"
          >
            <Card.Header className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2"><Icon name="job" /></div>
                <div>
                  <Card.Title className="m-0">{j.title}</Card.Title>
                  <Card.Description>{j.company}</Card.Description>
                </div>
              </div>
              <span className="text-xs text-gray-500">Posted {new Date(j.postedAt).toLocaleDateString()}</span>
            </Card.Header>

            <Card.Body>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-md bg-gray-100 px-2 py-1">{j.location}</span>
                <span className="rounded-md bg-gray-100 px-2 py-1">{j.type}</span>
              </div>
            </Card.Body>

            <Card.Footer>
              <span className="text-sm font-medium text-[var(--primary-color)]">View details →</span>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </div>
  );
}
