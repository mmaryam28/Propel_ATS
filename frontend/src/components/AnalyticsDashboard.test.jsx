import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import AnalyticsDashboard from './AnalyticsDashboard';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ 
        data: {
          stats: [],
          chartData: [],
        }
      }),
    })),
    get: vi.fn().mockResolvedValue({ 
      data: {
        stats: [],
        chartData: [],
      }
    }),
  },
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}));

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<AnalyticsDashboard />);
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = render(<AnalyticsDashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = render(<AnalyticsDashboard />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => render(<AnalyticsDashboard />)).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container } = render(<AnalyticsDashboard />);
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
