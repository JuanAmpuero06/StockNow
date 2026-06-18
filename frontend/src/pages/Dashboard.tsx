import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import { ProductModal } from '../components/ProductModal';
import { CartPanel } from '../components/CartPanel';
import { useAuth } from '../hooks/useAuth';
import { useWebSocketSync } from '../hooks/useWebSocketSync';
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders';
import { useAdjustStock } from '../hooks/useAdjustStock';
import { useUsers, useUpdateUserRole, useToggleUserActive } from '../hooks/useUsers';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { 
  Plus, Pencil, Trash2, ShoppingCart, ShoppingBag, LogOut, 
  PackagePlus, ClipboardList, Users, Package, AlertTriangle, 
  CheckCircle2, XCircle, History, Search, RefreshCw
} from 'lucide-react';
import type { Product } from '../types/product';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

interface CartItem {
  product: Product;
  quantity: number;
}

export const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  
  // Real-time synchronization
  useWebSocketSync(token);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  const { data: products, isLoading, isError, error } = useProducts(0, 100, searchTerm, showLowStockOnly);
  const { data: stats } = useDashboardStats(user?.role !== 'user');
  const deleteMutation = useDeleteProduct();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'users' | 'audit'>('catalog');

  // Modal & Panel state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Adjustment state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>('0');
  const [adjustReasonInput, setAdjustReasonInput] = useState<string>('');
  const adjustStockMutation = useAdjustStock();

  // Orders, Users & Audit logs hooks
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  
  const { data: usersList, isLoading: usersLoading } = useUsers();
  const updateUserRoleMutation = useUpdateUserRole();
  const toggleUserActiveMutation = useToggleUserActive();

  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs(activeTab === 'audit');

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto? Se borrará su inventario asociado. 🚨')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAdjust = (product: Product) => {
    setProductToAdjust(product);
    setAdjustQtyInput('0');
    setAdjustReasonInput('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToAdjust) return;
    const qty = parseInt(adjustQtyInput, 10);
    if (isNaN(qty)) return;

    adjustStockMutation.mutate(
      { productId: productToAdjust.id, quantity: qty, reason: adjustReasonInput },
      {
        onSuccess: () => {
          setAdjustModalOpen(false);
        },
        onError: (err: any) => {
          alert(err.response?.data?.detail || 'Error al ajustar el stock.');
        }
      }
    );
  };

  const handleAddToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      const currentQtyInCart = existing ? existing.quantity : 0;
      const available = product.inventory?.available_stock ?? 0;

      if (currentQtyInCart >= available) {
        alert(`No puedes añadir más unidades de ${product.name}. Stock máximo disponible alcanzado.`);
        return prevCart;
      }

      if (existing) {
        return prevCart.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleOrderStatusChange = (orderId: number, status: 'completed' | 'cancelled' | 'processing') => {
    if (confirm(`¿Estás seguro de cambiar el estado de la orden a '${status}'? Esta acción afectará el stock físico.`)) {
      updateStatusMutation.mutate({ orderId, status });
    }
  };

  const handleRoleChange = (userId: number, role: 'admin' | 'manager' | 'operator' | 'user') => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  const handleToggleUserActive = (userId: number, email: string) => {
    if (user?.email === email) {
      alert('Seguridad: No puedes desactivar tu propia cuenta administradora.');
      return;
    }
    toggleUserActiveMutation.mutate(userId);
  };

  const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isOperator = user?.role === 'operator';
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';

  const canAddProducts = isAdmin || isManager;
  const canEditProducts = isAdmin || isManager;
  const canDeleteProducts = isAdmin;
  const canAdjustStock = isAdmin || isManager || isOperator;
  const canViewOrders = isAdmin || isManager || isOperator;
  const canUseCart = isUser;

  const renderRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">Admin</Badge>;
      case 'manager':
        return <Badge variant="warning">Gestor</Badge>;
      case 'user':
        return <Badge variant="info">Sucursal</Badge>;
      case 'operator':
      default:
        return <Badge variant="success">Operador</Badge>;
    }
  };

  const renderOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Despachado</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelado</Badge>;
      case 'processing':
        return <Badge variant="info">Procesando</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning" className="animate-pulse">Pendiente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 gap-4 text-zinc-400">
        <RefreshCw className="animate-spin text-emerald-400" size={36} />
        <span className="text-sm font-semibold tracking-wider">Cargando StockNow...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-rose-400">
        <Card className="border border-rose-500/20 bg-rose-500/5 p-6 text-center max-w-sm">
          <AlertTriangle size={32} className="mx-auto mb-2 text-rose-500" />
          <p className="font-semibold mb-2">Error al iniciar dashboard</p>
          <p className="text-xs text-zinc-400 mb-4">{(error as Error).message}</p>
          <Button variant="danger" size="sm" onClick={() => window.location.reload()}>Reintentar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 md:p-8 text-zinc-100 font-sans selection:bg-emerald-500/25 selection:text-emerald-300">
      
      {/* Decorative Glow elements */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-500/5 blur-[120px]" />
      
      {/* HEADER SECTION */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-300 to-emerald-400 bg-clip-text text-transparent">
              StockNow Enterprise
            </h1>
            {user?.role === 'user' && <Badge variant="info">Sucursal App</Badge>}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Sistema de inventario inteligente en tiempo real y transacciones concurrentes
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* User profile card */}
          <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl px-4 py-2 text-xs">
            <div className="flex flex-col text-right">
              <span className="text-zinc-350 font-semibold">{user?.email}</span>
              <div className="flex justify-end mt-0.5">{renderRoleBadge(user?.role)}</div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* User Shopping Cart trigger button */}
          {canUseCart && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 transition-all hover:bg-zinc-850 hover:border-zinc-700 cursor-pointer shadow-md"
            >
              <ShoppingCart size={16} className="text-emerald-400" /> 
              <span className="hidden sm:inline">Solicitud de Stock</span>
              {totalItemsInCart > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-[10px] text-zinc-950 rounded-full h-4.5 w-4.5 flex items-center justify-center font-bold shadow-md shadow-emerald-500/25">
                  {totalItemsInCart}
                </span>
              )}
            </button>
          )}
          
          {/* Create Product Button */}
          {canAddProducts && activeTab === 'catalog' && (
            <Button 
              variant="primary" 
              size="md" 
              onClick={handleOpenCreate} 
              leftIcon={<Plus size={16} />}
            >
              Nuevo Producto
            </Button>
          )}
        </div>
      </header>

      {/* KPI METRIC CARDS (Visible only to operator, manager, admin) */}
      {user?.role !== 'user' && stats && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <Card className="flex items-center justify-between p-5 hover:border-zinc-750">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Total Productos</p>
              <h3 className="mt-1 text-2xl font-bold text-zinc-100 font-mono">{stats.total_products}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/80 text-zinc-400 border border-zinc-800/80">
              <Package size={18} />
            </div>
          </Card>

          <Card className={`flex items-center justify-between p-5 hover:border-zinc-750 ${
            stats.low_stock_count > 0 
              ? 'border-amber-500/20 bg-amber-500/2 shadow-xs shadow-amber-500/2' 
              : ''
          }`}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Alertas de Stock</p>
              <h3 className={`mt-1 text-2xl font-bold font-mono ${stats.low_stock_count > 0 ? 'text-amber-400' : 'text-zinc-100'}`}>
                {stats.low_stock_count}
              </h3>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              stats.low_stock_count > 0 ? 'bg-amber-500/10 text-amber-400 animate-pulse border border-amber-500/20' : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800/80'
            }`}>
              <AlertTriangle size={18} />
            </div>
          </Card>

          <Card className="flex items-center justify-between p-5 hover:border-zinc-750">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Despachos Pendientes</p>
              <h3 className="mt-1 text-2xl font-bold text-zinc-100 font-mono">{stats.pending_orders}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/80 text-zinc-400 border border-zinc-800/80">
              <ClipboardList size={18} />
            </div>
          </Card>

          <Card className="flex items-center justify-between p-5 hover:border-zinc-750">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Valor Despachado</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-400 font-mono">${Number(stats.total_sales).toFixed(2)}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/80 text-emerald-400 border border-zinc-800/80">
              <ShoppingCart size={18} />
            </div>
          </Card>
        </motion.div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-zinc-900 mb-6 overflow-x-auto gap-2 scrollbar-none">
        <button 
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/2' 
              : 'border-transparent text-zinc-450 hover:text-zinc-200'
          }`}
        >
          <Package size={14} /> Catálogo de Stock
        </button>
        {canViewOrders && (
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/2' 
                : 'border-transparent text-zinc-450 hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={14} /> Cola de Despachos
          </button>
        )}
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('orders')}
            onClickCapture={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/2' 
                : 'border-transparent text-zinc-450 hover:text-zinc-200'
            }`}
          >
            <Users size={14} /> Gestión de Personal
          </button>
        )}
        {user?.role !== 'user' && (
          <button 
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/2' 
                : 'border-transparent text-zinc-450 hover:text-zinc-200'
            }`}
          >
            <History size={14} /> Auditoría
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: CATALOG INVENTORY */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Filtrar por SKU, nombre, descripción..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 py-2.5 pl-10 pr-10 text-xs text-zinc-100 placeholder-zinc-500 transition-all focus:border-zinc-700 focus:outline-hidden"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-zinc-350 font-semibold cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="flex items-center self-start sm:self-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 select-none">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950 cursor-pointer"
                />
                Solo stock bajo el mínimo
              </label>
            </div>
          </div>

          {/* INVENTORY VIEWS */}
          {(!products || products.length === 0) ? (
            <div className="text-center text-zinc-500 py-16 bg-zinc-900/10 rounded-2xl border border-zinc-800/60">
              <Package size={36} className="mx-auto mb-2 opacity-50 stroke-1" />
              <p className="text-xs">No se encontraron productos en el catálogo.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30 backdrop-blur-md shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="p-4 pl-6">SKU</th>
                      <th className="p-4">Producto</th>
                      <th className="p-4">Precio</th>
                      <th className="p-4">Físico</th>
                      <th className="p-4">Reservado</th>
                      <th className="p-4">Disponible</th>
                      <th className="p-4 text-center">Estados</th>
                      {(canAdjustStock || canEditProducts || canDeleteProducts) && <th className="p-4 pr-6 text-center">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-xs">
                    <AnimatePresence>
                      {products.map((product) => {
                        const available = product.inventory?.available_stock ?? 0;
                        const threshold = product.inventory?.min_stock_threshold ?? 5;
                        const isLowStock = available <= threshold;
                        
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={product.id} 
                            className="transition-all duration-300 hover:bg-zinc-900/20"
                          >
                            <td className="p-4 pl-6 font-mono text-emerald-400 font-semibold">{product.sku}</td>
                            <td className="p-4">
                              <div className="font-semibold text-zinc-200">{product.name}</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1 max-w-xs">{product.description || 'Sin descripción'}</div>
                            </td>
                            <td className="p-4 font-mono font-medium text-zinc-300">${Number(product.price).toFixed(2)}</td>
                            <td className="p-4 text-zinc-400 font-mono">{product.inventory?.quantity ?? 0}</td>
                            <td className="p-4 text-amber-500/80 font-mono">{product.inventory?.reserved_quantity ?? 0}</td>
                            <td className="p-4">
                              <Badge variant={available > 0 ? 'success' : 'danger'}>
                                {available} units
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isLowStock && (
                                  <Badge variant="warning" className="animate-pulse">
                                    <AlertTriangle size={10} className="mr-1" /> Stock Bajo
                                  </Badge>
                                )}
                                {canUseCart && (
                                  <button 
                                    onClick={() => handleAddToCart(product)}
                                    disabled={available <= 0}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-emerald-500 hover:text-zinc-950 border border-zinc-800 hover:border-emerald-500 transition-all disabled:opacity-20 cursor-pointer"
                                  >
                                    <ShoppingBag size={11} /> Añadir
                                  </button>
                                )}
                              </div>
                            </td>
                            
                            {/* Management Actions */}
                            {(canAdjustStock || canEditProducts || canDeleteProducts) && (
                              <td className="p-4 pr-6 text-center">
                                <div className="flex items-center justify-center gap-2.5">
                                  {canAdjustStock && (
                                    <button 
                                      onClick={() => handleOpenAdjust(product)}
                                      className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-lg transition-all cursor-pointer"
                                      title="Ajuste de inventario físico"
                                    >
                                      <PackagePlus size={15} />
                                    </button>
                                  )}
                                  {canEditProducts && (
                                    <button 
                                      onClick={() => handleOpenEdit(product)} 
                                      className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all cursor-pointer" 
                                      title="Editar"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  )}
                                  {canDeleteProducts && (
                                    <button 
                                      onClick={() => handleDelete(product.id)} 
                                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all cursor-pointer" 
                                      title="Eliminar"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* MOBILE GRID VIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                <AnimatePresence>
                  {products.map((product) => {
                    const available = product.inventory?.available_stock ?? 0;
                    const threshold = product.inventory?.min_stock_threshold ?? 5;
                    const isLowStock = available <= threshold;
                    
                    return (
                      <Card key={product.id} className="p-4 border-zinc-800 bg-zinc-950/40 hover:border-zinc-750">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider">{product.sku}</span>
                            <h4 className="font-bold text-zinc-200 mt-0.5 text-sm">{product.name}</h4>
                            <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1">{product.description || 'Sin descripción'}</p>
                          </div>
                          <span className="font-mono text-xs font-semibold text-zinc-300">${Number(product.price).toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-zinc-900 text-[11px]">
                          <div>
                            <span className="text-zinc-500 block">Físico</span>
                            <span className="font-semibold text-zinc-350">{product.inventory?.quantity ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Reservado</span>
                            <span className="font-semibold text-amber-500/80">{product.inventory?.reserved_quantity ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Disponible</span>
                            <span className="font-semibold text-emerald-400">{available} ud.</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-1">
                          <div className="flex gap-1.5">
                            {isLowStock && <Badge variant="warning">Bajo</Badge>}
                            <Badge variant={available > 0 ? 'success' : 'danger'}>
                              {available > 0 ? 'En stock' : 'Agotado'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            {canUseCart && (
                              <button 
                                onClick={() => handleAddToCart(product)}
                                disabled={available <= 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-emerald-500 hover:text-zinc-950 border border-zinc-800 hover:border-emerald-500 transition-all disabled:opacity-20 cursor-pointer"
                              >
                                <ShoppingBag size={12} /> Añadir
                              </button>
                            )}

                            {canAdjustStock && (
                              <button 
                                onClick={() => handleOpenAdjust(product)}
                                className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-xl transition-all border border-zinc-900 cursor-pointer"
                                title="Ajuste de inventario físico"
                              >
                                <PackagePlus size={14} />
                              </button>
                            )}

                            {canEditProducts && (
                              <button 
                                onClick={() => handleOpenEdit(product)} 
                                className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/5 rounded-xl transition-all border border-zinc-900 cursor-pointer"
                              >
                                <Pencil size={13} />
                              </button>
                            )}

                            {canDeleteProducts && (
                              <button 
                                onClick={() => handleDelete(product.id)} 
                                className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all border border-zinc-900 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: COLA DE DESPACHOS */}
      {activeTab === 'orders' && canViewOrders && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="text-center text-zinc-500 py-12">Cargando cola de órdenes...</div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center text-zinc-500 py-16 bg-zinc-900/10 rounded-2xl border border-zinc-800/60">
              <ClipboardList className="mx-auto mb-2 opacity-50 stroke-1" size={36} />
              <p className="text-xs">No hay órdenes procesadas en el sistema.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP COLA DE DESPACHOS */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30 backdrop-blur-md shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="p-4 pl-6">ID Solicitud</th>
                      <th className="p-4">Solicitante</th>
                      <th className="p-4">Valor Estimado</th>
                      <th className="p-4">Fecha Creación</th>
                      <th className="p-4">Items y Cantidades</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 pr-6 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-xs">
                    {orders.map((order) => (
                      <tr key={order.id} className="transition-all hover:bg-zinc-900/20">
                        <td className="p-4 pl-6 font-mono font-bold text-zinc-300">#000{order.id}</td>
                        <td className="p-4 text-zinc-400">{order.user_id === 1 ? "test@stocknow.com" : `Usuario ID: ${order.user_id}`}</td>
                        <td className="p-4 font-semibold text-emerald-400 font-mono">${Number(order.total_amount).toFixed(2)}</td>
                        <td className="p-4 text-zinc-500 font-mono text-[10px]">{new Date(order.created_at).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="text-[10px] text-zinc-400">
                                Prod ID: <span className="font-semibold font-mono text-zinc-300">{item.product_id}</span> x <span className="font-semibold text-emerald-400">{item.quantity}</span> (${Number(item.unit_price).toFixed(2)})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">{renderOrderStatusBadge(order.status)}</td>
                        <td className="p-4 pr-6 text-center">
                          {order.status === 'pending' || order.status === 'processing' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => handleOrderStatusChange(order.id, 'processing')}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 cursor-pointer transition-all"
                                >
                                  Procesar
                                </button>
                              )}
                              <button 
                                onClick={() => handleOrderStatusChange(order.id, 'completed')}
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 border border-emerald-500/20 transition-all cursor-pointer"
                                title="Despachar pedido"
                              >
                                <CheckCircle2 size={11} /> Despachar
                              </button>
                              <button 
                                onClick={() => handleOrderStatusChange(order.id, 'cancelled')}
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-zinc-950 border border-rose-500/20 transition-all cursor-pointer"
                                title="Cancelar pedido"
                              >
                                <XCircle size={11} /> Cancelar
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-650 italic font-medium">Finalizada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE COLA DE DESPACHOS VIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4 border-zinc-800 bg-zinc-950/40">
                    <div className="flex justify-between items-start mb-2 pb-2 border-b border-zinc-900">
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-300">#000{order.id}</span>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      {renderOrderStatusBadge(order.status)}
                    </div>
                    
                    <div className="text-xs text-zinc-400 my-2">
                      <p className="mb-2">Usuario: <span className="font-mono font-semibold text-zinc-300">{order.user_id === 1 ? "test@stocknow.com" : `ID: ${order.user_id}`}</span></p>
                      <div className="bg-zinc-950/30 rounded-xl p-2.5 border border-zinc-900/60 max-h-24 overflow-y-auto space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-[10px] flex justify-between">
                            <span>Prod #{item.product_id} x {item.quantity}</span>
                            <span className="font-mono text-zinc-400">${Number(item.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-900">
                      <span className="text-xs font-mono font-bold text-emerald-400">${Number(order.total_amount).toFixed(2)}</span>
                      
                      <div className="flex items-center gap-1">
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => handleOrderStatusChange(order.id, 'processing')}
                            className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
                          >
                            Procesar
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <>
                            <button 
                              onClick={() => handleOrderStatusChange(order.id, 'completed')}
                              className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 border border-emerald-500/20 cursor-pointer"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleOrderStatusChange(order.id, 'cancelled')}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-zinc-950 border border-rose-500/20 cursor-pointer"
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: PERSONAL / USER MANAGEMENT */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-4">
          {usersLoading ? (
            <div className="text-center text-zinc-500 py-12">Cargando cuentas...</div>
          ) : (
            <>
              {/* DESKTOP USERS TABLE */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30 backdrop-blur-md shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="p-4 pl-6">ID</th>
                      <th className="p-4">Correo Electrónico</th>
                      <th className="p-4">Rol del Sistema</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-center">Asignar Rol</th>
                      <th className="p-4 pr-6 text-center">Acciones Acceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-xs">
                    {usersList?.map((u) => (
                      <tr key={u.id} className="transition-all hover:bg-zinc-900/20">
                        <td className="p-4 pl-6 font-mono font-bold text-zinc-500">#{u.id}</td>
                        <td className="p-4 text-zinc-200 font-semibold">{u.email}</td>
                        <td className="p-4">{renderRoleBadge(u.role)}</td>
                        <td className="p-4">
                          <Badge variant={u.is_active ? 'success' : 'danger'}>
                            {u.is_active ? "Activo" : "Bloqueado"}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                            disabled={user?.email === u.email}
                            className="rounded-lg border border-zinc-800 bg-zinc-900 py-1 px-2 text-[11px] text-zinc-150 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 cursor-pointer"
                          >
                            <option value="user">Sucursal</option>
                            <option value="operator">Operator</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <button
                            onClick={() => handleToggleUserActive(u.id, u.email)}
                            disabled={user?.email === u.email}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                              u.is_active 
                                ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-zinc-950 border-rose-500/20' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-zinc-950 border-emerald-500/20'
                            } disabled:opacity-20`}
                          >
                            {u.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE USERS VIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {usersList?.map((u) => (
                  <Card key={u.id} className="p-4 border-zinc-800 bg-zinc-950/40">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 font-bold">#{u.id}</span>
                        <h4 className="font-bold text-zinc-250 text-sm mt-0.5">{u.email}</h4>
                      </div>
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? "Activo" : "Bloqueado"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-900">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500 mr-1.5 uppercase font-semibold">Rol:</span>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                          disabled={user?.email === u.email}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 py-1 px-2 text-[10px] text-zinc-150 focus:outline-hidden disabled:opacity-40 cursor-pointer"
                        >
                          <option value="user">Sucursal</option>
                          <option value="operator">Operator</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleToggleUserActive(u.id, u.email)}
                        disabled={user?.email === u.email}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                          u.is_active 
                            ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-zinc-950 border-rose-500/20' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 border-emerald-500/20'
                        } disabled:opacity-20`}
                      >
                        {u.is_active ? 'Bloquear' : 'Desbloquear'}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: AUDIT LOGS */}
      {activeTab === 'audit' && user?.role !== 'user' && (
        <div className="space-y-4">
          {auditLoading ? (
            <div className="text-center text-zinc-500 py-12">Cargando registros...</div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center text-zinc-500 py-16 bg-zinc-900/10 rounded-2xl border border-zinc-800/60">
              <History className="mx-auto mb-2 opacity-50 stroke-1" size={36} />
              <p className="text-xs">No hay registros de auditoría de inventario.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP AUDIT TABLE */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30 backdrop-blur-md shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="p-4 pl-6">Fecha / Hora</th>
                      <th className="p-4">Producto</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Usuario</th>
                      <th className="p-4 text-center">Cantidad</th>
                      <th className="p-4 pr-6">Motivo / Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="transition-all hover:bg-zinc-900/20 text-zinc-350">
                        <td className="p-4 pl-6 font-mono text-[10px] text-zinc-550">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-4 text-zinc-200 font-medium">{log.product?.name || `Prod ID: ${log.product_id}`}</td>
                        <td className="p-4 font-mono text-emerald-450 font-semibold">{log.product?.sku || 'N/A'}</td>
                        <td className="p-4 text-zinc-400">{log.user?.email || `User ID: ${log.user_id}`}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold font-mono text-[11px] ${
                            log.quantity_changed > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {log.quantity_changed > 0 ? `+${log.quantity_changed}` : log.quantity_changed}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-zinc-400">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE AUDIT VIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {auditLogs.map((log) => (
                  <Card key={log.id} className="p-4 border-zinc-800 bg-zinc-950/40 text-xs text-zinc-400">
                    <div className="flex justify-between items-start mb-2 border-b border-zinc-900 pb-2">
                      <span className="font-mono text-[10px] text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                      <span className={`font-mono text-xs font-bold ${
                        log.quantity_changed > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {log.quantity_changed > 0 ? `+${log.quantity_changed}` : log.quantity_changed}
                      </span>
                    </div>

                    <p className="mb-1">Producto: <span className="font-semibold text-zinc-200">{log.product?.name || `Prod ID: ${log.product_id}`}</span> {log.product?.sku && <span className="text-[10px] text-emerald-400 font-mono">({log.product.sku})</span>}</p>
                    <p className="mb-1">Usuario: <span className="font-semibold text-zinc-300">{log.user?.email || `ID: ${log.user_id}`}</span></p>
                    <p className="mt-2 text-zinc-400 bg-zinc-950/30 p-2 rounded-lg border border-zinc-900/40 font-mono text-[11px]">{log.reason}</p>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: PRODUCT CREATE / EDIT */}
      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} productToEdit={selectedProduct} />
      
      {/* MODAL 2: SHOPPING CART */}
      {canUseCart && (
        <CartPanel 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cartItems={cart}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={() => setCart([])}
        />
      )}

      {/* MODAL 3: INVENTORY ADJUSTMENT / MERMAS */}
      <Modal 
        isOpen={adjustModalOpen && !!productToAdjust} 
        onClose={() => setAdjustModalOpen(false)}
        title="Ajuste Físico de Inventario"
        maxWidth="sm"
      >
        {productToAdjust && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 text-xs space-y-1 text-zinc-400">
              <p>Producto: <span className="font-semibold text-zinc-200">{productToAdjust.name}</span></p>
              <p>SKU: <span className="font-mono text-emerald-400">{productToAdjust.sku}</span></p>
              <p>Stock Físico Actual: <span className="font-mono font-semibold text-zinc-200">{productToAdjust.inventory?.quantity ?? 0}</span></p>
            </div>
            
            <Input 
              label="Cantidad a ajustar"
              type="number"
              required
              placeholder="Ej. +10 o -5"
              value={adjustQtyInput}
              onChange={e => setAdjustQtyInput(e.target.value)}
            />
            <span className="text-[10px] text-zinc-500 block leading-normal">
              Escribe un número positivo (+) para registrar ingresos de stock, o un número negativo (-) para registrar mermas o diferencias.
            </span>

            <Input 
              label="Motivo del Ajuste"
              type="text"
              required
              placeholder="Ej. Ingreso de proveedor, Merma por daño"
              value={adjustReasonInput}
              onChange={e => setAdjustReasonInput(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-6">
              <Button type="button" variant="ghost" onClick={() => setAdjustModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={adjustStockMutation.isPending}>
                Aplicar Ajuste
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
