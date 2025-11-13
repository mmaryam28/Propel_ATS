import React from 'react';
import { listJobs, updateJobStatus, bulkUpdateJobStatus, daysInStage } from '../lib/api';
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAnalytics } from '../contexts/AnalyticsContext';

const STATUSES = [
  'Interested',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
];

function statusColor(status) {
  switch (status) {
    case 'Interested': return 'bg-blue-50 border-blue-200';
    case 'Applied': return 'bg-indigo-50 border-indigo-200';
    case 'Phone Screen': return 'bg-yellow-50 border-yellow-200';
    case 'Interview': return 'bg-orange-50 border-orange-200';
    case 'Offer': return 'bg-green-50 border-green-200';
    case 'Rejected': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

function DroppableColumn({ id, className, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className + (isOver ? ' outline outline-2 outline-[var(--primary-color)]/40' : '')}>
      {children}
    </div>
  );
}

function JobCard({ job, selected, toggleSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: job.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const days = daysInStage(job);
  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-white p-3 shadow-sm flex flex-col gap-2" {...attributes} {...listeners}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold leading-tight">{job.title}</div>
          <div className="text-xs text-gray-600">{job.company}</div>
        </div>
        <input type="checkbox" checked={selected} onChange={() => toggleSelect(job.id)} className="mt-0.5" />
      </div>
      <div className="flex flex-wrap gap-1 text-[11px] text-gray-700">
        {typeof days === 'number' && <span className="rounded bg-gray-100 px-1.5 py-0.5">{days}d in stage</span>}
        {job.location && <span className="rounded bg-gray-100 px-1.5 py-0.5">{job.location}</span>}
        {job.jobType && <span className="rounded bg-gray-100 px-1.5 py-0.5">{job.jobType}</span>}
      </div>
      {job.postingUrl && (
        <a href={job.postingUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--primary-color)]">Posting →</a>
      )}
    </div>
  );
}

export default function JobPipeline() {
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [updating, setUpdating] = React.useState(false);
  const { triggerRefresh } = useAnalytics();

  React.useEffect(() => { load(); }, []);

  function normalizeStatus(job) {
    const STATUSES_SET = new Map(STATUSES.map(s => [s.toLowerCase(), s]));
    const raw = (job.status ?? '').toString().trim();
    if (!raw) return { ...job, status: 'Interested' };
    const mapped = STATUSES_SET.get(raw.toLowerCase());
    return mapped ? { ...job, status: mapped } : { ...job, status: 'Interested' };
  }

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await listJobs();
      const normalized = data.map(normalizeStatus);
      setJobs(normalized);
    } catch (e) {
      setError('Failed to load jobs');
    } finally { setLoading(false); }
  }

  function byStatus(status) { return jobs.filter(j => (j.status || 'Interested') === status); }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!active || !over) return;
    const activeId = active.id;
  const overContainer = over.id; // droppable column id equals status
    const sourceJob = jobs.find(j => j.id === activeId);
    if (!sourceJob || sourceJob.status === overContainer) return; // same column
    // optimistic update
    setJobs(prev => prev.map(j => j.id === activeId ? { ...j, status: overContainer, statusUpdatedAt: new Date().toISOString() } : j));
    try {
      await updateJobStatus(activeId, overContainer);
      // Trigger analytics refresh after successful status update
      triggerRefresh();
    } catch (e) {
      // revert on failure
      setJobs(prev => prev.map(j => j.id === activeId ? sourceJob : j));
      console.error(e);
    }
  }

  async function bulkMove(targetStatus) {
    if (!selectedIds.length) return;
    setUpdating(true);
    const snapshot = jobs;
    setJobs(prev => prev.map(j => selectedIds.includes(j.id) ? { ...j, status: targetStatus, statusUpdatedAt: new Date().toISOString() } : j));
    try {
      await bulkUpdateJobStatus(selectedIds, targetStatus);
      setSelectedIds([]);
      // Trigger analytics refresh after successful bulk update
      triggerRefresh();
    } catch (e) {
      setJobs(snapshot); // revert
      console.error(e);
    } finally { setUpdating(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Pipeline</h1>
          <p className="text-sm text-gray-600">Drag jobs between stages to update status.</p>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                disabled={updating}
                onClick={() => bulkMove(s)}
                className="btn btn-secondary btn-sm"
              >Move to {s}</button>
            ))}
          </div>
        )}
      </div>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="text-sm text-gray-600">Loading…</div> : (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6 md:grid-cols-3">
            {STATUSES.map(status => {
              const columnJobs = byStatus(status);
              return (
                <SortableContext key={status} items={columnJobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                  <DroppableColumn id={status} className={`flex flex-col gap-3 rounded-xl border p-3 ${statusColor(status)}`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold tracking-tight text-gray-900">{status}</h2>
                      <span className="text-xs rounded bg-white/70 px-1.5 py-0.5 shadow-sm">{columnJobs.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[60px]">
                      {columnJobs.map(j => (
                        <JobCard key={j.id} job={j} selected={selectedIds.includes(j.id)} toggleSelect={toggleSelect} />
                      ))}
                      {columnJobs.length === 0 && (
                        <div className="text-[11px] text-gray-500 italic">No jobs</div>
                      )}
                    </div>
                  </DroppableColumn>
                </SortableContext>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
}