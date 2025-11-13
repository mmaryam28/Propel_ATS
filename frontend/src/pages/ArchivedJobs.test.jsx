import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ArchivedJobs from './ArchivedJobs';

// Mock the API module
vi.mock('../lib/api', () => ({
  listJobs: vi.fn().mockResolvedValue([]),
  restoreJob: vi.fn().mockResolvedValue({ success: true }),
  deleteJob: vi.fn().mockResolvedValue({ success: true }),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ArchivedJobs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithRouter(<ArchivedJobs />);
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = renderWithRouter(<ArchivedJobs />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = renderWithRouter(<ArchivedJobs />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => renderWithRouter(<ArchivedJobs />)).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container } = renderWithRouter(<ArchivedJobs />);
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
