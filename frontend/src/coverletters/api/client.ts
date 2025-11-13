export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`http://localhost:3000/coverletters${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------- Template functions ----------

export interface TemplateResponse {
  id: string;
  title: string;
  slug: string;
  latest?: { body?: string };
  category?: { name?: string; slug?: string };
}

export const listTemplates = (q?: string, category?: string) =>
  api<any[]>(`/templates${toQS({ q, category })}`);

export const getTemplate = (slug: string) =>
  api<TemplateResponse>(`/templates/${slug}`);

// ---------- UC-060 + UC-061 helpers ----------

export async function saveEditedCoverLetter(slug: string, content: string) {
  const res = await fetch(`http://localhost:3000/coverletters/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, content }),
  });
  if (!res.ok) throw new Error("Failed to save edits");
  return res.json();
}

export async function exportCoverLetter(text: string, format: string) {
  const res = await fetch(`http://localhost:3000/coverletters/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, format }),
  });
  if (!res.ok) throw new Error("Failed to export");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `coverletter.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------- Utility ----------
function toQS(obj: Record<string, any>) {
  const s = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== '') s.append(k, String(v));
  });
  const qs = s.toString();
  return qs ? `?${qs}` : '';
}
