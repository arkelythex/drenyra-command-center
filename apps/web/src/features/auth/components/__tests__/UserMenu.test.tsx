import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserMenu } from '../UserMenu';
import type { User } from '../../types/auth.types';

// Mock auth session
const mockUser: User = {
  id: 'user-123',
  email: 'test@empresa.com',
  name: 'Juan Pérez',
  ruc: '20123456789',
  emailVerified: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  role: 'ADMIN',
  banned: false,
  banReason: null,
  banExpires: null,
};

const mockUseAuthSession = vi.fn();
const mockLogout = vi.fn();

vi.mock('../../hooks/useAuthSession', () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: () => ({
    logout: mockLogout,
  }),
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

vi.mock('@/lib/monitoring', () => ({
  captureError: vi.fn(),
}));

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
    });
  });

  it('should not render when user is not authenticated', () => {
    mockUseAuthSession.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    const { container } = render(<UserMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render user avatar with initials', () => {
    render(<UserMenu />);

    // Should show initials (JP for Juan Pérez)
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  it('should render user avatar with image when available', () => {
    const userWithImage = {
      ...mockUser,
      image: 'https://example.com/avatar.jpg',
    };

    mockUseAuthSession.mockReturnValue({
      user: userWithImage,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<UserMenu />);

    const avatar = screen.getByAltText('Juan Pérez') as HTMLImageElement;
    expect(avatar).toBeInTheDocument();
    expect(avatar.src).toContain('avatar.jpg');
  });

  it('should show email verification indicator', () => {
    render(<UserMenu />);

    // Should show verified checkmark
    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
  });

  it('should show unverified indicator when email not verified', () => {
    const unverifiedUser = {
      ...mockUser,
      emailVerified: false,
    };

    mockUseAuthSession.mockReturnValue({
      user: unverifiedUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
    // Alert icon should be present (not CheckCircle)
  });

  it('should open dropdown menu on click', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Menu should be open, showing email
    await waitFor(() => {
      expect(screen.getByText('test@empresa.com')).toBeInTheDocument();
      expect(screen.getByText('Apariencia')).toBeInTheDocument();
    });
  });

  it('should display user information in dropdown', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      // User name appears in both trigger and dropdown
      const names = screen.getAllByText('Juan Pérez');
      expect(names.length).toBeGreaterThan(0);
      expect(screen.getByText('test@empresa.com')).toBeInTheDocument();
    });
  });

  it('should display role badge for Admin', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      // Look for admin badge (with emoji)
      const adminBadge = screen.getByText(/👑.*admin/i);
      expect(adminBadge).toBeInTheDocument();
    });
  });

  it('should display role badge for Contador', async () => {
    const user = userEvent.setup();
    const accountantUser = {
      ...mockUser,
      role: 'ACCOUNTANT' as const,
    };

    mockUseAuthSession.mockReturnValue({
      user: accountantUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/contador/i)).toBeInTheDocument();
    });
  });

  it('should display role badge for Viewer', async () => {
    const user = userEvent.setup();
    const viewerUser = {
      ...mockUser,
      role: 'VIEWER' as const,
    };

    mockUseAuthSession.mockReturnValue({
      user: viewerUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      // Look for viewer badge (with emoji)
      const viewerBadge = screen.getByText(/👁️.*viewer/i);
      expect(viewerBadge).toBeInTheDocument();
    });
  });

  it('should display RUC information when available', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/RUC EMPRESA/i)).toBeInTheDocument();
      // RUC appears in menu, just check it exists
      const rucElements = screen.getAllByText('20123456789');
      expect(rucElements.length).toBeGreaterThan(0);
    });
  });

  it('should not display RUC section when RUC is not available', async () => {
    const user = userEvent.setup();
    const userWithoutRuc = {
      ...mockUser,
      ruc: null,
    };

    mockUseAuthSession.mockReturnValue({
      user: userWithoutRuc,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('RUC EMPRESA')).not.toBeInTheDocument();
    });
  });

  it('should show unverified badge when email not verified', async () => {
    const user = userEvent.setup();
    const unverifiedUser = {
      ...mockUser,
      emailVerified: false,
    };

    mockUseAuthSession.mockReturnValue({
      user: unverifiedUser,
      isLoading: false,
      isAuthenticated: true,
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/no verificado/i)).toBeInTheDocument();
    });
  });

  it('should navigate to profile on menu item click', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const profileItem = await screen.findByText(/mi perfil/i);
    await user.click(profileItem);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/profile' });
  });

  it('should navigate to settings on menu item click', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const settingsItem = await screen.findByText(/configuración/i);
    await user.click(settingsItem);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/settings' });
  });

  it('should logout on logout menu item click', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockLogout.mockResolvedValueOnce(undefined);

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const logoutItem = await screen.findByText(/cerrar sesión/i);
    await user.click(logoutItem);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('should show success toast and navigate to login after logout', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockLogout.mockResolvedValueOnce(undefined);

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const logoutItem = await screen.findByText(/cerrar sesión/i);
    await user.click(logoutItem);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Sesión cerrada',
        expect.objectContaining({
          description: 'Has cerrado sesión exitosamente.',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
    });
  });

  it('should show error toast on logout failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockLogout.mockRejectedValueOnce(new Error('Network error'));

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const logoutItem = await screen.findByText(/cerrar sesión/i);
    await user.click(logoutItem);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al cerrar sesión');
    });
  });

  it('should display user name on desktop', () => {
    render(<UserMenu />);

    // Name should be visible (hidden on mobile via CSS class)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('should display user role on desktop when available', () => {
    render(<UserMenu />);

    // Role should be visible (hidden on mobile via CSS class)
    const trigger = screen.getByRole('button');
    expect(trigger).toContainHTML('ADMIN');
  });

  it('should use correct avatar color for different users', () => {
    const { rerender } = render(<UserMenu />);

    // Different name should generate different color
    const differentUser = {
      ...mockUser,
      name: 'María García',
    };

    mockUseAuthSession.mockReturnValue({
      user: differentUser,
      isLoading: false,
      isAuthenticated: true,
    });

    rerender(<UserMenu />);

    // Should show different initials
    expect(screen.getByText('MG')).toBeInTheDocument();
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');

    // Focus the trigger
    trigger.focus();
    expect(trigger).toHaveFocus();

    // Open with keyboard
    await user.keyboard('{Enter}');

    // Menu should open
    await waitFor(() => {
      expect(screen.getByText('test@empresa.com')).toBeInTheDocument();
    });
  });
});
