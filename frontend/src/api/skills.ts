import type { Skill, SkillCategory, SkillProficiency } from '../types/skills';

const BASE = import.meta.env.VITE_API_BASE || 'https://cs490-backend.onrender.com'; // adjust if proxied

export async function listSkills(userId: string, search?: string): Promise<Skill[]> {
  const url = new URL(`${BASE}/skills`);
  url.searchParams.set('userId', userId);
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createSkill(payload: {
  userId: string; name: string; category: SkillCategory; proficiency: SkillProficiency;
}): Promise<Skill> {
  const res = await fetch(`${BASE}/skills`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSkill(id: string, payload: Partial<Skill> & { userId: string }): Promise<Skill> {
  const res = await fetch(`${BASE}/skills/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type':'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSkill(id: string): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/skills/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function reorderCategory(userId: string, category: SkillCategory, orderedIds: string[]) {
  const res = await fetch(`${BASE}/skills/reorder/list`, {
    method: 'PATCH',
    headers: { 'Content-Type':'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, category, orderedIds }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Skill[]>;
}
