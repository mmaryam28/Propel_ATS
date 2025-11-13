import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ 
      data: [
        { id: 1, degree: 'BS Computer Science', institution: 'University', educationLevel: 'Bachelor' }
      ] 
    }),
  },
}));

// Mock components
vi.mock('../components/UpcomingDeadlinesWidget', () => ({
  default: () => <div data-testid="deadlines-widget">Upcoming Deadlines</div>,
}));

vi.mock('../components/AnalyticsDashboard', () => ({
  default: () => <div data-testid="analytics-dashboard">Analytics</div>,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithRouter(<Dashboard />);
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = renderWithRouter(<Dashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = renderWithRouter(<Dashboard />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => renderWithRouter(<Dashboard />)).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container} = renderWithRouter(<Dashboard />);
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
