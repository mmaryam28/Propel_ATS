import { TemplateCardData } from '../types';

type Props = {
  template: TemplateCardData;
  onPreview: (slug: string) => void;
};

export default function TemplateCard({ template, onPreview }: Props) {
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      <div className="text-lg font-semibold">{template.title}</div>
      <div className="text-sm text-gray-600">{template.description}</div>

      {template.sample_preview && (
        <div className="text-xs bg-gray-50 border rounded p-2 line-clamp-3">
          {template.sample_preview}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[11px]">
        {template.tokens?.map((t) => (
          <span key={t} className="border rounded px-2 py-0.5">{`{{${t}}}`}</span>
        ))}
      </div>

      <button
        onClick={() => onPreview(template.slug)}
        className="border rounded px-3 py-1 text-sm self-start hover:bg-gray-100"
      >
        Preview
      </button>
    </div>
  );
}
