import { lazy } from 'react';

export const CoverletterTemplatesRoute = {
  path: '/coverletters/templates',
  element: lazy(() => import('./pages/TemplatesPage')),
};

export const CoverletterGenerateRoute = {
  path: '/coverletters/generate',
  element: lazy(() => import('./pages/GeneratePage')),
};

export const CoverletterSavedRoute = {
  path: '/coverletters/saved',
  element: lazy(() => import('./pages/SavedCoverLettersPage')),
};

export const CoverletterEditRoute = {
  path: '/coverletters/edit/:id',
  element: lazy(() => import('./pages/EditCoverLetterPage')),
};
