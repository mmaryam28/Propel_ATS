import { useEffect, useState } from 'react';
import { listTemplates } from '../api/client';
import TemplateCard from '../components/TemplateCard';
import TemplatePreviewModal from '../components/TemplatePreviewModal';
import type { TemplateCardData } from '../types';

console.log("TemplatesPage loaded successfully!");

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateCardData[]>([]);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [search, setSearch] = useState('');

useEffect(() => {
  listTemplates(search).then(setTemplates).catch(console.error);
}, [search]);



  return (
    <div className="p-6 max-w-6xl mx-auto text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Cover Letter Templates</h1>

      <input
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Search templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid md:grid-cols-3 gap-4">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onPreview={setPreviewSlug}
          />
        ))}
      </div>

      <TemplatePreviewModal slug={previewSlug} onClose={() => setPreviewSlug(null)} />
    </div>
  );
}
