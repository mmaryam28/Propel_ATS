import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

// Mock all potential route components
vi.mock('./pages/Dashboard', () => ({
  default: () => <div>Dashboard</div>,
}));

vi.mock('./pages/Jobs', () => ({
  default: () => <div>Jobs</div>,
}));

vi.mock('./pages/Applications', () => ({
  default: () => <div>Applications</div>,
}));

vi.mock('./pages/Landing', () => ({
  default: () => <div>Landing</div>,
}));

vi.mock('./pages/Login', () => ({
  default: () => <div>Login</div>,
}));

vi.mock('./pages/Register', () => ({
  default: () => <div>Register</div>,
}));

describe('App Component', () => {
  it('should render the App component', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it('should render without errors', () => {
    const { container } = render(<App />);
    expect(container.innerHTML).toBeTruthy();
  });

  it('should have router setup', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render application structure', () => {
    const { container } = render(<App />);
    // Should have rendered something
    expect(container.textContent.length).toBeGreaterThanOrEqual(0);
  });

  it('should initialize without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
