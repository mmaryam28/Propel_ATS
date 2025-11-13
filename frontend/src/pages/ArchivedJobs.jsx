// frontend/src/pages/ArchivedJobs.jsx
import React from "react";
import { Link } from "react-router-dom";
import { listArchivedJobs, restoreJob, deleteJob } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";

export default function ArchivedJobs() {
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [restoring, setRestoring] = React.useState(null);
  const [deleting, setDeleting] = React.useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listArchivedJobs();
      setJobs(data);
    } catch (e) {
      setError("Failed to load archived jobs.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function handleRestore(jobId) {
    setRestoring(jobId);
    setError("");
    try {
      await restoreJob(jobId);
      // Remove from list after successful restore
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to restore";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally {
      setRestoring(null);
    }
  }

  async function handleDelete(jobId) {
    setDeleting(jobId);
    setError("");
    try {
      await deleteJob(jobId);
      // Remove from list after successful delete
      setJobs(jobs.filter(j => j.id !== jobId));
      setShowDeleteConfirm(null);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete";
      setError(Array.isArray(msg) ? msg.join("; ") : msg);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Archived Jobs</h1>
          <p className="text-sm text-gray-600">View and manage your archived job applications</p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white bg-[var(--primary-color)] hover:brightness-90"
        >
          <Icon name="chevronLeft" variant="white" />
          Back to Jobs
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="text-sm text-gray-600">Loading archived jobs...</div>
      ) : jobs.length === 0 ? (
        <Card variant="default" size="large">
          <Card.Body>
            <div className="text-center py-8">
              <p className="text-gray-600">No archived jobs found.</p>
              <Link to="/jobs" className="text-[var(--primary-color)] hover:underline text-sm mt-2 inline-block">
                Go back to active jobs
              </Link>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} variant="default" size="large">
              <Card.Body>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-[var(--primary-color)]"
                        >
                          {job.title}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                        {job.location && (
                          <p className="text-sm text-gray-500 mt-1">
                            <Icon name="mapPin" variant="gray" className="inline-block w-4 h-4 mr-1" />
                            {job.location}
                          </p>
                        )}
                        {job.archiveReason && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            Reason: {job.archiveReason}
                          </p>
                        )}
                        {job.archivedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Archived on {new Date(job.archivedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      className="btn btn-secondary text-sm"
                      onClick={() => handleRestore(job.id)}
                      disabled={restoring === job.id}
                    >
                      {restoring === job.id ? "Restoring..." : "Restore"}
                    </button>
                    <button
                      className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm"
                      onClick={() => setShowDeleteConfirm(job.id)}
                      disabled={deleting === job.id}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Job</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to permanently delete this job? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting === showDeleteConfirm}
              >
                Cancel
              </button>
              <button
                className="btn bg-red-600 text-white hover:bg-red-700"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleting === showDeleteConfirm}
              >
                {deleting === showDeleteConfirm ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
