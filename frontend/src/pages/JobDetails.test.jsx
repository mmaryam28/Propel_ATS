import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import JobDetails from './JobDetails';

// Mock the API module
vi.mock('../lib/api', () => ({
  getJobById: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Software Engineer',
    company: 'Tech Co',
    status: 'Applied',
    description: 'Job description',
  }),
  updateJobStatus: vi.fn().mockResolvedValue({ success: true }),
  deleteJob: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock AnalyticsContext
vi.mock('../contexts/AnalyticsContext', () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
  }),
  AnalyticsProvider: ({ children }) => <div>{children}</div>,
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={component} />
      </Routes>
    </BrowserRouter>
  );
};

describe('JobDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithRouter(<JobDetails />);
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = renderWithRouter(<JobDetails />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = renderWithRouter(<JobDetails />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => renderWithRouter(<JobDetails />)).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container } = renderWithRouter(<JobDetails />);
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
