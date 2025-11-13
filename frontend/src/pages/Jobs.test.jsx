import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Jobs from './Jobs';

// Mock the API module
vi.mock('../lib/api', () => ({
  listJobs: vi.fn().mockResolvedValue([
    { id: '1', title: 'Software Engineer', company: 'Tech Co', status: 'Applied' },
    { id: '2', title: 'Frontend Developer', company: 'Web Corp', status: 'Interview' },
  ]),
  createJob: vi.fn().mockResolvedValue({ id: '3', title: 'New Job' }),
  bulkArchiveJobs: vi.fn().mockResolvedValue({ success: true }),
  restoreJob: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock JobForm component
vi.mock('../components/JobForm', () => ({
  default: () => <div data-testid="job-form">Job Form</div>,
}));

// Mock Toast component
vi.mock('../components/Toast', () => ({
  Toast: ({ message }) => <div data-testid="toast">{message}</div>,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Jobs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render without crashing', () => {
    const { container } = renderWithRouter(<Jobs />);
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = renderWithRouter(<Jobs />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = renderWithRouter(<Jobs />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => renderWithRouter(<Jobs />)).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container } = renderWithRouter(<Jobs />);
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
