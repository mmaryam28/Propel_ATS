import { useEffect, useState } from 'react';
import { getTemplate } from '../api/client';

export default function TemplatePreviewModal({
  slug,
  onClose,
}: {
  slug: string | null;
  onClose: () => void;
}) {
  const [body, setBody] = useState<string>('');

  useEffect(() => {
    if (slug) getTemplate(slug).then((t) => setBody(t.latest?.body ?? ''));
  }, [slug]);

  if (!slug) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Preview</div>
          <button onClick={onClose}>✕</button>
        </div>
        <pre className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50 max-h-[60vh] overflow-auto">
          {body}
        </pre>
      </div>
    </div>
  );
}
