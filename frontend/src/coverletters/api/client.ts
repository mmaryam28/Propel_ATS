export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`http://localhost:3000/coverletters${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const listTemplates = (q?: string, category?: string) =>
  api<any[]>(`/templates${toQS({ q, category })}`);

export const getTemplate = (slug: string) =>
  api<any>(`/templates/${slug}`);

function toQS(obj: Record<string, any>) {
  const s = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== '') s.append(k, String(v));
  });
  const qs = s.toString();
  return qs ? `?${qs}` : '';
}
