// src/components/profile/ProfileSkills.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Skill,
  SkillCategory,
  SkillProficiency,
  SKILL_CATEGORIES,
  PROFICIENCY_LEVELS,
  COMMON_SKILLS,
} from '../../types/skills';
import { listSkills, createSkill, updateSkill, deleteSkill, reorderCategory } from '../../api/skills';
import { SortableItem } from './SortableItem';

const badgeStyles: Record<SkillCategory, string> = {
  Technical: 'bg-indigo-100 text-indigo-800',
  'Soft Skills': 'bg-emerald-100 text-emerald-800',
  Languages: 'bg-amber-100 text-amber-800',
  'Industry-Specific': 'bg-fuchsia-100 text-fuchsia-800',
};

type Props = { userId: string };

export default function ProfileSkills({ userId }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ name: string; category: SkillCategory; proficiency: SkillProficiency }>({
    name: '',
    category: 'Technical',
    proficiency: 'Beginner',
  });
  const [confirmDelete, setConfirmDelete] = useState<Skill | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listSkills(userId);
        setSkills(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? skills.filter((s) => s.name.toLowerCase().includes(q)) : skills;
  }, [skills, search]);

  const byCategory = useMemo(() => {
    const map = new Map<SkillCategory, Skill[]>();
    SKILL_CATEGORIES.forEach((c) => map.set(c, []));
    filtered.forEach((s) => map.set(s.category, [ ...(map.get(s.category) ?? []), s ]));
    SKILL_CATEGORIES.forEach((c) => map.set(c, (map.get(c) ?? []).sort((a, b) => a.order - b.order)));
    return map;
  }, [filtered]);

  const categorySummaries = useMemo(() => {
    const res: Record<SkillCategory, Record<SkillProficiency, number>> = {
      Technical: { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 },
      'Soft Skills': { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 },
      Languages: { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 },
      'Industry-Specific': { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 },
    };
    filtered.forEach((s) => {
      // Defensive check to prevent undefined errors
      if (res[s.category] && res[s.category][s.proficiency] !== undefined) {
        res[s.category][s.proficiency] += 1;
      } else {
        console.warn('Unknown skill data:', s); // helps debug invalid entries
      }
    });
    return res;
  }, [filtered]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    // frontend duplicate guard
    if (skills.some((s) => s.name.toLowerCase() === form.name.trim().toLowerCase())) {
      alert('Duplicate skill');
      return;
    }

    const newSkill = await createSkill({ userId, ...form });
    setSkills((prev) => [...prev, newSkill]);
    setForm({ name: '', category: form.category, proficiency: 'Beginner' });
  }

  async function onEdit(id: string, changes: Partial<Skill>) {
    const updated = await updateSkill(id, { userId, ...changes });
    setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }

  async function onDeleteConfirmed() {
    if (!confirmDelete) return;
    await deleteSkill(confirmDelete.id);
    setSkills((prev) => prev.filter((s) => s.id !== confirmDelete.id));
    setConfirmDelete(null);
  }

  function exportCSV() {
    const rows = [['Name', 'Category', 'Proficiency']];
    filtered.forEach((s) => rows.push([s.name, s.category, s.proficiency]));
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skills.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="input input-bordered px-3 py-2 rounded-md border w-56"
          />
          <button onClick={exportCSV} className="px-3 py-2 rounded-md border hover:bg-gray-50">
            Export CSV
          </button>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-xl border bg-white">
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-medium">Skill</label>
          <input
            list="skill-suggestions"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full mt-1 px-3 py-2 border rounded-md"
            placeholder="e.g., React, Python, HIPAA"
            required
          />
          <datalist id="skill-suggestions">
            {COMMON_SKILLS[form.category].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">Autocomplete adapts to the selected category.</p>
        </div>

        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as SkillCategory }))}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          >
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Proficiency</label>
          <select
            value={form.proficiency}
            onChange={(e) => setForm((f) => ({ ...f, proficiency: e.target.value as SkillProficiency }))}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          >
            {PROFICIENCY_LEVELS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <button type="submit" className="btn btn-primary btn-sm">
            Add Skill
          </button>
        </div>
      </form>

      {/* Grouped lists */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading skills…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SKILL_CATEGORIES.map((category) => {
            const items = byCategory.get(category) ?? [];
            const summary = categorySummaries[category];

            return (
              <div key={category} className="border rounded-xl p-4 bg-white">
                {/* ===== Fixed header (no wrapping / stray counts) ===== */}
                <div className="flex items-center justify-between mb-3 gap-3">
                  {/* left: badge + total */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-1 rounded ${badgeStyles[category]}`}>{category}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">({items.length})</span>
                  </div>
                  {/* right: per-level stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 whitespace-nowrap">
                    <span>
                      Beginner: <strong>{summary.Beginner}</strong>
                    </span>
                    <span>
                      Intermediate: <strong>{summary.Intermediate}</strong>
                    </span>
                    <span>
                      Advanced: <strong>{summary.Advanced}</strong>
                    </span>
                    <span>
                      Expert: <strong>{summary.Expert}</strong>
                    </span>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={async (event: { active: any; over: any }) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;

                    const current = items.map((i) => i.id);
                    const oldIndex = current.indexOf(String(active.id));
                    const newIndex = current.indexOf(String(over.id));
                    const newOrder = arrayMove(current, oldIndex, newIndex);

                    // optimistic UI
                    setSkills((prev) => {
                      const copy = [...prev];
                      newOrder.forEach((id: string, idx: number) => {
                        const k = copy.findIndex((s) => s.id === id);
                        if (k >= 0) copy[k] = { ...copy[k], order: idx + 1 };
                      });
                      return copy;
                    });

                    try {
                      const server = await reorderCategory(userId, category, newOrder as string[]);
                      setSkills(server);
                    } catch {
                      const fresh = await listSkills(userId);
                      setSkills(fresh);
                    }
                  }}
                >
                  <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2">
                      {items.map((s) => (
                        <SortableItem key={s.id} id={s.id}>
                          <li className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white">
                            <div className="flex items-center gap-3">
                              <span className="cursor-grab select-none">⋮⋮</span>
                              <span className="font-medium">{s.name}</span>
                              <span className="text-xs text-gray-500">#{s.order}</span>
                              <span className="text-xs px-2 py-1 rounded bg-gray-100">{s.proficiency}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Move between categories */}
                              <select
                                className="text-sm border rounded px-2 py-1"
                                value={s.category}
                                onChange={(e) => onEdit(s.id, { category: e.target.value as SkillCategory })}
                              >
                                {SKILL_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>

                              {/* Edit proficiency */}
                              <select
                                className="text-sm border rounded px-2 py-1"
                                value={s.proficiency}
                                onChange={(e) => onEdit(s.id, { proficiency: e.target.value as SkillProficiency })}
                              >
                                {PROFICIENCY_LEVELS.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>

                              {/* Remove with confirmation */}
                              <button
                                className="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                                onClick={() => setConfirmDelete(s)}
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        </SortableItem>
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Remove skill?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove "<strong>{confirmDelete.name}</strong>"?
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={onDeleteConfirmed}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
