import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
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

vi.mock('../hooks/useDashboardStats', () => ({
  useDashboardStats: vi.fn(() => ({
    data: {
      total_products: 1,
      low_stock_count: 0,
      pending_orders: 0,
      total_sales: 0,
    },
    isLoading: false,
  })),
}));

vi.mock('../hooks/useAuditLogs', () => ({
  useAuditLogs: vi.fn(() => ({
    data: [],
    isLoading: false,
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

  it('does not render "Nuevo Producto" button for user/client role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'user@stocknow.com', role: 'user', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { queryByText } = renderWithClient(<Dashboard />);
    expect(queryByText('Nuevo Producto')).toBeNull();
  });

  it('renders "Nuevo Producto" button for manager role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 3, email: 'manager@stocknow.com', role: 'manager', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { queryByText } = renderWithClient(<Dashboard />);
    expect(queryByText('Nuevo Producto')).not.toBeNull();
  });

  it('renders "Nuevo Producto" button for admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, email: 'admin@stocknow.com', role: 'admin', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { queryByText } = renderWithClient(<Dashboard />);
    expect(queryByText('Nuevo Producto')).not.toBeNull();
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

    const { queryByText, queryAllByText } = renderWithClient(<Dashboard />);
    expect(queryByText('Carrito Comercial')).not.toBeNull();
    expect(queryAllByText('Añadir').length).toBeGreaterThan(0);
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

    const { queryByText, queryByText: queryAñadir } = renderWithClient(<Dashboard />);
    expect(queryByText('Carrito Comercial')).toBeNull();
    expect(queryAñadir('Añadir')).toBeNull();
  });

  // ─── WAREHOUSE ADJUSTMENT ACCESSIBILITY ───

  it('renders "Ajuste de inventario físico" button for operator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 4, email: 'operator@stocknow.com', role: 'operator', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { queryAllByTitle } = renderWithClient(<Dashboard />);
    expect(queryAllByTitle('Ajuste de inventario físico').length).toBeGreaterThan(0);
  });

  it('does not render "Ajuste de inventario físico" button for user/client role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'user@stocknow.com', role: 'user', is_active: true },
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { queryByTitle } = renderWithClient(<Dashboard />);
    expect(queryByTitle('Ajuste de inventario físico')).toBeNull();
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

    const { queryAllByTitle } = renderWithClient(<Dashboard />);
    expect(queryAllByTitle('Editar').length).toBeGreaterThan(0);
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

    const { queryByTitle } = renderWithClient(<Dashboard />);
    expect(queryByTitle('Editar')).toBeNull();
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

    const { queryAllByTitle } = renderWithClient(<Dashboard />);
    expect(queryAllByTitle('Eliminar').length).toBeGreaterThan(0);
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

    const { queryByTitle } = renderWithClient(<Dashboard />);
    expect(queryByTitle('Eliminar')).toBeNull();
  });
});
