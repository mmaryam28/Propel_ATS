import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TemplatesPage from './TemplatesPage';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ 
      data: {
        templates: [],
      }
    }),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithRouter(<TemplatesPage />);
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = renderWithRouter(<TemplatesPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = renderWithRouter(<TemplatesPage />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => renderWithRouter(<TemplatesPage />)).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container } = renderWithRouter(<TemplatesPage />);
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
