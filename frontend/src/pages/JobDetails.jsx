import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";

// TEMP: same demo data to show a filled page
const JOBS = {
  "123": { title: "Frontend Engineer", company: "Acme Inc.", location: "Remote (US)", type: "Full-time", postedAt: "2025-02-01", desc: "Build React components and collaborate with design." },
  "456": { title: "Backend Engineer", company: "Globex", location: "NYC, NY", type: "Contract", postedAt: "2025-01-20", desc: "Own APIs and database performance." },
};

export default function JobDetails() {
  const { jobId } = useParams();
  const job = JOBS[jobId] || { title: "Job", company: "", location: "", type: "", postedAt: "", desc: "" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{job.title}</h1>
          <p className="text-sm text-gray-600">{job.company}</p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white
                     bg-[var(--primary-color)] hover:brightness-90"
        >
          <Icon name="chevronLeft" variant="white" />
          Back to jobs
        </Link>
      </div>

      {/* Summary card */}
      <Card variant="default" size="large">
        <Card.Body className="grid gap-3 sm:grid-cols-2">
          <div className="text-sm">
            <div className="text-gray-500">Location</div>
            <div className="font-medium">{job.location || "—"}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-500">Type</div>
            <div className="font-medium">{job.type || "—"}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-500">Posted</div>
            <div className="font-medium">{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "—"}</div>
          </div>
        </Card.Body>
      </Card>

      {/* Description */}
      <Card variant="default" size="large">
        <Card.Header>
          <Card.Title>About the role</Card.Title>
        </Card.Header>
        <Card.Body>
          <p className="text-gray-700">{job.desc || "Job description will appear here."}</p>
        </Card.Body>
      </Card>
    </div>
  );
}
