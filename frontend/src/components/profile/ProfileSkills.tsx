// src/components/profile/ProfileSkills.tsx
import React, { useEffect, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Skill,
  SkillCategory,
  SKILL_CATEGORIES,
  COMMON_SKILLS,
} from '../../types/skills';
import { listSkills, createSkill, updateSkill, deleteSkill, reorderCategory } from '../../api/skills';
import { SortableItem } from './SortableItem';
import ConfirmDialog from '../ConfirmDialog';

const badgeStyles: Record<SkillCategory, string> = {
  Technical: 'bg-indigo-100 text-indigo-800',
  'Soft Skills': 'bg-emerald-100 text-emerald-800',
};

type Props = { userId: string };

export default function ProfileSkills({ userId }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ name: string; category: SkillCategory }>({
    name: '',
    category: 'Technical',
  });
  const [confirmDelete, setConfirmDelete] = useState<Skill | null>(null);
  const [error, setError] = useState<string>('');
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

  const byCategory = {
    Technical: skills.filter(s => s.category === 'Technical').sort((a, b) => a.order - b.order),
    'Soft Skills': skills.filter(s => s.category === 'Soft Skills').sort((a, b) => a.order - b.order),
  };

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (skills.some((s) => s.name.toLowerCase() === form.name.trim().toLowerCase())) {
      setError('This skill already exists');
      return;
    }

    setError('');
    const newSkill = await createSkill({ userId, ...form });
    setSkills((prev) => [...prev, newSkill]);
    setForm({ name: '', category: form.category });
  }

  async function onEdit(id: string, changes: Partial<Skill>) {
    const updated = await updateSkill(id, { userId, ...changes });
    setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }

  async function onDelete(skill: Skill) {
    setConfirmDelete(skill);
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    await deleteSkill(confirmDelete.id);
    setSkills((prev) => prev.filter((s) => s.id !== confirmDelete.id));
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={onAdd} className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Add Skill</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-600">Skill Name</label>
            <input
              list={form.category === 'Soft Skills' ? 'skill-suggestions' : undefined}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder={
                form.category === 'Technical'
                  ? 'e.g., React, Python, AutoCAD, Salesforce'
                  : 'e.g., Communication, Leadership, Spanish'
              }
              required
            />
            {form.category === 'Soft Skills' && (
              <>
                <datalist id="skill-suggestions">
                  {COMMON_SKILLS['Soft Skills'].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">Select from suggestions or type your own</p>
              </>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Category</label>
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
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-3">
          <button type="submit" className="btn btn-primary">
            Add Skill
          </button>
        </div>
      </form>

      {/* Skill lists by category */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading skills…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SKILL_CATEGORIES.map((category) => {
            const items = byCategory[category] || [];

            return (
              <div key={category} className="border rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-md font-medium ${badgeStyles[category]}`}>
                      {category}
                    </span>
                    <span className="text-sm text-gray-500">({items.length})</span>
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
                          <li className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <span className="cursor-grab select-none text-gray-400">⋮⋮</span>
                              <span className="font-medium text-gray-900">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
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

                              <button
                                className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                                onClick={() => onDelete(s)}
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

                {items.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No skills in this category yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Remove Skill"
        message={`Are you sure you want to remove "${confirmDelete?.name}" from your skills?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
