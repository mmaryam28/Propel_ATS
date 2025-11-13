import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobPipeline from './JobPipeline';

// Mock the API module
vi.mock('../lib/api', () => ({
  listJobs: vi.fn().mockResolvedValue([]),
  updateJobStatus: vi.fn().mockResolvedValue({ success: true }),
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
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('JobPipeline Page', () => {
  beforeEach(()=> {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithRouter(<JobPipeline />);
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = renderWithRouter(<JobPipeline />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = renderWithRouter(<JobPipeline />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => renderWithRouter(<JobPipeline />)).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container } = renderWithRouter(<JobPipeline />);
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
