export type TemplateCardData = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  sample_preview?: string;
  tokens: string[];
  category?: { name: string; slug: string };
  latest?: { body: string };
};
