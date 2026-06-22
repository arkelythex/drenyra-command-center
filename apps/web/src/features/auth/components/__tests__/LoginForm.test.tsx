import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm, resolveSafeLoginRedirect } from '../LoginForm';

// Mock auth store
const mockLogin = vi.fn();
const mockAuthStore = {
  login: mockLogin,
  isLoading: false,
};

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isLoading = false;
    window.history.pushState(null, '', '/login');
  });

  it('keeps credential fields empty by default', () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText(/usuario@arkelythex/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/••••/)).toHaveValue('');
  });

  it('should render login form with email and password fields', () => {
    render(<LoginForm />);

    // Check for email input (by placeholder)
    expect(screen.getByPlaceholderText(/usuario@arkelythex/i)).toBeInTheDocument();

    // Check for password input (by placeholder)
    expect(screen.getByPlaceholderText(/••••/)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole('button', { name: /autenticar/i })).toBeInTheDocument();
  });

  it('should have remember me checkbox', () => {
    render(<LoginForm />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/usuario@arkelythex/i);
    const submitButton = screen.getByRole('button', { name: /autenticar/i });

    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/correo corporativo válido/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/usuario@arkelythex/i);
    const passwordInput = screen.getByPlaceholderText(/••••/);
    const submitButton = screen.getByRole('button', { name: /autenticar/i });

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'test@empresa.com');
    await user.type(passwordInput, 'SecurePass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@empresa.com',
        password: 'SecurePass123',
      });
    });
  });

  it('should navigate after successful login', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/usuario@arkelythex/i);
    const passwordInput = screen.getByPlaceholderText(/••••/);
    const submitButton = screen.getByRole('button', { name: /autenticar/i });

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'test@empresa.com');
    await user.type(passwordInput, 'SecurePass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ from: '/login', to: '/' });
    });
  });

  it('should redirect to intended page after login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    window.history.pushState(null, '', '/login?redirect=/dashboard');

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/usuario@arkelythex/i);
    const passwordInput = screen.getByPlaceholderText(/••••/);
    const submitButton = screen.getByRole('button', { name: /autenticar/i });

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'test@empresa.com');
    await user.type(passwordInput, 'SecurePass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ from: '/login', to: '/dashboard' });
    });
  });

  it('should not redirect to external URLs', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    window.history.pushState(null, '', '/login?redirect=https://evil.com');

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/usuario@arkelythex/i);
    const passwordInput = screen.getByPlaceholderText(/••••/);
    const submitButton = screen.getByRole('button', { name: /autenticar/i });

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'test@empresa.com');
    await user.type(passwordInput, 'SecurePass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ from: '/login', to: '/' });
    });
  });

  it('should show error on login failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/usuario@arkelythex/i);
    const passwordInput = screen.getByPlaceholderText(/••••/);
    const submitButton = screen.getByRole('button', { name: /autenticar/i });

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'test@empresa.com');
    await user.type(passwordInput, 'WrongPassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('should disable submit button while loading', () => {
    mockAuthStore.isLoading = true;

    render(<LoginForm />);

    // Get submit button specifically (type="submit")
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn => btn.getAttribute('type') === 'submit');

    expect(submitButton).toBeDefined();
    expect(submitButton).toBeDisabled();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText(/••••/) as HTMLInputElement;

    expect(passwordInput.type).toBe('password');

    // Find eye icon button
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find(btn => !btn.getAttribute('type') || btn.getAttribute('type') === 'button');

    if (toggleButton && toggleButton !== screen.getByRole('button', { name: /autenticar/i })) {
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');
    }
  });

  it('should have link to signup page', () => {
    render(<LoginForm />);

    const signupLink = screen.getByRole('link', { name: /crear cuenta/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('should have link to forgot password page', () => {
    render(<LoginForm />);

    const forgotLink = screen.getByRole('link', { name: /recuperar/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });
});

describe('resolveSafeLoginRedirect', () => {
  it('only accepts same-app absolute paths', () => {
    expect(resolveSafeLoginRedirect('?redirect=/dashboard')).toBe('/dashboard');
    expect(resolveSafeLoginRedirect('?redirect=https://evil.com')).toBe('/');
    expect(resolveSafeLoginRedirect('?redirect=//evil.com')).toBe('/');
    expect(resolveSafeLoginRedirect('?redirect=%2F%2Fevil.com')).toBe('/');
    expect(resolveSafeLoginRedirect('?redirect=/safe?next=https://evil.com')).toBe('/');
  });
});
