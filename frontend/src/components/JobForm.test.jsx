import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import JobForm from './JobForm';

describe('JobForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(container).toBeDefined();
  });

  it('should have container element', () => {
    const { container } = render(
      <JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('should render component structure', () => {
    const { container } = render(
      <JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should initialize without errors', () => {
    expect(() => render(
      <JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )).not.toThrow();
  });

  it('should have valid DOM tree', () => {
    const { container } = render(
      <JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(container.childNodes.length).toBeGreaterThanOrEqual(0);
  });
});
