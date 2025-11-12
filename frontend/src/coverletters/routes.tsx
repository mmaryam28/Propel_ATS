import { lazy } from 'react';
export const CoverletterTemplatesRoute = {
  path: '/coverletters/templates',
  element: lazy(() => import('./pages/TemplatesPage')),
};
