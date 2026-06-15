import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '../pages/Dashboard';
import { useAuth } from '../hooks/useAuth';

// Mock all hooks to prevent actual network/websocket calls
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useCreateProduct', () => ({
  useCreateProduct: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

vi.mock('../hooks/useUpdateProduct', () => ({
  useUpdateProduct: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({
    data: [
      {
        id: 1,
        sku: 'TEST-SKU-1',
        name: 'Test Product 1',
        description: 'Test description 1',
        price: 99.99,
        inventory: {
          quantity: 10,
          reserved_quantity: 2,
          available_stock: 8,
          min_stock_threshold: 3,
        },
      },
    ],
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('../hooks/useDeleteProduct', () => ({
  useDeleteProduct: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

vi.mock('../hooks/useWebSocketSync', () => ({
  useWebSocketSync: vi.fn(),
}));

vi.mock('../hooks/useOrders', () => ({
  useOrders: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useUpdateOrderStatus: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

vi.mock('../hooks/useAdjustStock', () => ({
  useAdjustStock: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../hooks/useUsers', () => ({
  useUsers: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useUpdateUserRole: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useToggleUserActive: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Dashboard Component - Corrected RBAC Permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ─── PRODUCT CREATION BUTTON ───

  it('does not render "Agregar Producto" button for user/client role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'user@stocknow.com', role: 'user', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByText('Agregar Producto')).toBeNull();
  });

  it('renders "Agregar Producto" button for manager role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 3, email: 'manager@stocknow.com', role: 'manager', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByText('Agregar Producto')).not.toBeNull();
  });

  it('renders "Agregar Producto" button for admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, email: 'admin@stocknow.com', role: 'admin', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByText('Agregar Producto')).not.toBeNull();
  });

  // ─── SHOPPING CART ACCESSIBILITY ───

  it('renders "Carrito Comercial" and product checkout button for user role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'user@stocknow.com', role: 'user', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByText('Carrito Comercial')).not.toBeNull();
    expect(screen.queryByText('Añadir')).not.toBeNull();
  });

  it('does not render "Carrito Comercial" or product checkout button for operator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 4, email: 'operator@stocknow.com', role: 'operator', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByText('Carrito Comercial')).toBeNull();
    expect(screen.queryByText('Añadir')).toBeNull();
  });

  it('does not render "Carrito Comercial" or product checkout button for manager role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 3, email: 'manager@stocknow.com', role: 'manager', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByText('Carrito Comercial')).toBeNull();
    expect(screen.queryByText('Añadir')).toBeNull();
  });

  it('does not render "Carrito Comercial" or product checkout button for admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, email: 'admin@stocknow.com', role: 'admin', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByText('Carrito Comercial')).toBeNull();
    expect(screen.queryByText('Añadir')).toBeNull();
  });

  // ─── WAREHOUSE ADJUSTMENT ACCESSIBILITY ───

  it('renders "Ajuste rápido" button for operator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 4, email: 'operator@stocknow.com', role: 'operator', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByTitle('Ajuste rápido de inventario físico (Ingresos / Mermas)')).not.toBeNull();
  });

  it('does not render "Ajuste rápido" button for user/client role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'user@stocknow.com', role: 'user', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByTitle('Ajuste rápido de inventario físico (Ingresos / Mermas)')).toBeNull();
  });

  // ─── PRODUCT EDIT & DELETE ───

  it('shows edit/pencil button for manager', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 3, email: 'manager@stocknow.com', role: 'manager', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByTitle('Editar detalles')).not.toBeNull();
  });

  it('does not show edit/pencil button for user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'user@stocknow.com', role: 'user', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByTitle('Editar detalles')).toBeNull();
  });

  it('shows delete button for admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, email: 'admin@stocknow.com', role: 'admin', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByTitle('Eliminar catálogo')).not.toBeNull();
  });

  it('does not show delete button for manager role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 3, email: 'manager@stocknow.com', role: 'manager', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithClient(<Dashboard />);
    expect(screen.queryByTitle('Eliminar catálogo')).toBeNull();
  });
});
