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
import { 
  Plus, Pencil, Trash2, ShoppingCart, ShoppingBag, LogOut, 
  PackagePlus, ClipboardList, Users, Package, AlertTriangle, 
  CheckCircle2, XCircle, UserCheck, UserMinus 
} from 'lucide-react';
import type { Product } from '../types/product';

interface CartItem {
  product: Product;
  quantity: number;
}

export const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  
  // Activar sincronización en tiempo real mediante WebSockets
  useWebSocketSync(token);
  
  const { data: products, isLoading, isError, error } = useProducts(0, 10);
  const deleteMutation = useDeleteProduct();
  
  // Tab activa
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'users'>('catalog');

  // Estados de Control de Modales y Paneles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Estado del Carrito
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modal de Ajuste de Stock
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>('0');
  const adjustStockMutation = useAdjustStock();

  // Hooks para Órdenes y Usuarios
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  
  const { data: usersList, isLoading: usersLoading } = useUsers();
  const updateUserRoleMutation = useUpdateUserRole();
  const toggleUserActiveMutation = useToggleUserActive();

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
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToAdjust) return;
    const qty = parseInt(adjustQtyInput, 10);
    if (isNaN(qty)) return;

    adjustStockMutation.mutate(
      { productId: productToAdjust.id, quantity: qty },
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

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">Administrador</span>;
      case 'manager':
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">Gestor</span>;
      case 'user':
        return <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">Usuario</span>;
      case 'operator':
      default:
        return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">Operador</span>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">Despachado</span>;
      case 'cancelled':
        return <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">Cancelado</span>;
      case 'processing':
        return <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">Procesando</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20 animate-pulse">Pendiente</span>;
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-900"><div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;
  if (isError) return <div className="flex h-screen items-center justify-center bg-slate-900 text-red-400"><p>Error: {(error as Error).message}</p></div>;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">StockNow Enterprise</h1>
          <p className="text-sm text-slate-400">Control unificado de inventario, usuarios y despachos concurrentes</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Perfil del Usuario & Logout */}
          <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs text-slate-300 font-semibold">{user?.email}</span>
              <div className="flex justify-end mt-0.5">{getRoleBadge(user?.role)}</div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Botón indicador del Carrito (Solo para rol user/cliente) */}
          {canUseCart && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 cursor-pointer"
            >
              <ShoppingCart size={18} /> Carrito Comercial
              {totalItemsInCart > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                  {totalItemsInCart}
                </span>
              )}
            </button>
          )}
          
          {canAddProducts && activeTab === 'catalog' && (
            <button onClick={handleOpenCreate} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500 cursor-pointer">
              <Plus size={18} /> Agregar Producto
            </button>
          )}
        </div>
      </header>

      {/* Tabs de Navegación de Roles */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button 
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'catalog' ? 'border-emerald-500 text-emerald-400 bg-slate-800/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Package size={16} /> Catálogo e Inventario
        </button>
        {canViewOrders && (
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'orders' ? 'border-emerald-500 text-emerald-400 bg-slate-800/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <ClipboardList size={16} /> Cola de Despachos
          </button>
        )}
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'users' ? 'border-emerald-500 text-emerald-400 bg-slate-800/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Users size={16} /> Control de Usuarios
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl animate-fadeIn">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase text-slate-400">
                <th className="p-4">SKU</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Stock Físico</th>
                <th className="p-4">Reservado</th>
                <th className="p-4">Disponible</th>
                <th className="p-4 text-center">{canUseCart ? "Alertas / Venta" : "Alertas"}</th>
                {(canAdjustStock || canEditProducts || canDeleteProducts) && <th className="p-4 text-center">Gestión</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {products?.map((product) => {
                const available = product.inventory?.available_stock ?? 0;
                const threshold = product.inventory?.min_stock_threshold ?? 5;
                const isLowStock = available <= threshold;
                
                return (
                  <tr key={product.id} className="transition-colors hover:bg-slate-900/30">
                    <td className="p-4 font-mono font-medium text-emerald-400">{product.sku}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{product.name}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{product.description || 'Sin descripción'}</div>
                    </td>
                    <td className="p-4 font-medium">${Number(product.price).toFixed(2)}</td>
                    <td className="p-4 text-slate-300">{product.inventory?.quantity ?? 0}</td>
                    <td className="p-4 text-amber-400">{product.inventory?.reserved_quantity ?? 0}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${available > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {available} unidades
                      </span>
                    </td>
                    {/* Alertas y Venta */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20 animate-pulse" title="Stock disponible por debajo del umbral mínimo">
                            <AlertTriangle size={12} /> Stock Bajo
                          </span>
                        )}
                        {canUseCart && (
                          <button 
                            onClick={() => handleAddToCart(product)}
                            disabled={available <= 0}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all disabled:opacity-20 cursor-pointer"
                          >
                            <ShoppingBag size={12} /> Añadir
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Ajuste y Gestión */}
                    {(canAdjustStock || canEditProducts || canDeleteProducts) && (
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* Botón de ajuste rápido (entradas y salidas) para Bodega */}
                          {canAdjustStock && (
                            <button 
                              onClick={() => handleOpenAdjust(product)}
                              className="inline-flex items-center gap-1 p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                              title="Ajuste rápido de inventario físico (Ingresos / Mermas)"
                            >
                              <PackagePlus size={16} />
                            </button>
                          )}
                          {canEditProducts && (
                            <button onClick={() => handleOpenEdit(product)} className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer" title="Editar detalles">
                              <Pencil size={15} />
                            </button>
                          )}
                          {canDeleteProducts && (
                            <button onClick={() => handleDelete(product.id)} className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Eliminar catálogo">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 2: ORDER QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fadeIn">
          {ordersLoading ? (
            <div className="text-center text-slate-400 py-10">Cargando cola de órdenes...</div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center text-slate-500 py-10 bg-slate-950 rounded-xl border border-slate-800">No hay órdenes procesadas en el sistema.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase text-slate-400">
                    <th className="p-4">ID Orden</th>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Fecha Creación</th>
                    <th className="p-4">Items y Cantidades</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Acciones de Despacho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-slate-900/30">
                      <td className="p-4 font-mono font-bold text-white">#000{order.id}</td>
                      <td className="p-4 text-slate-300">{order.user_id === 1 ? "test@stocknow.com" : `Usuario ID: ${order.user_id}`}</td>
                      <td className="p-4 font-semibold text-emerald-400">${Number(order.total_amount).toFixed(2)}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{new Date(order.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-xs text-slate-300">
                              ID Prod: <span className="font-mono text-emerald-400">{item.product_id}</span> x <span className="font-semibold">{item.quantity}</span> (${Number(item.unit_price).toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">{getOrderStatusBadge(order.status)}</td>
                      <td className="p-4 text-center">
                        {order.status === 'pending' || order.status === 'processing' ? (
                          <div className="flex items-center justify-center gap-2">
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => handleOrderStatusChange(order.id, 'processing')}
                                className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                              >
                                Procesar
                              </button>
                            )}
                            <button 
                              onClick={() => handleOrderStatusChange(order.id, 'completed')}
                              className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                              title="Confirmar empaque y despacho físico de bodega"
                            >
                              <CheckCircle2 size={13} /> Despachar
                            </button>
                            <button 
                              onClick={() => handleOrderStatusChange(order.id, 'cancelled')}
                              className="inline-flex items-center gap-1 rounded bg-rose-600 hover:bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                              title="Cancelar orden y liberar stock reservado"
                            >
                              <XCircle size={13} /> Cancelar
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium italic">Orden Finalizada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: USER MANAGEMENT */}
      {activeTab === 'users' && isAdmin && (
        <div className="animate-fadeIn">
          {usersLoading ? (
            <div className="text-center text-slate-400 py-10">Cargando cuentas de usuario...</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase text-slate-400">
                    <th className="p-4">ID</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Rol del Sistema</th>
                    <th className="p-4">Estado Cuenta</th>
                    <th className="p-4 text-center">Cambiar Rol (Admin Only)</th>
                    <th className="p-4 text-center">Toggle Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {usersList?.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-slate-900/30">
                      <td className="p-4 font-mono font-bold text-slate-400">#{u.id}</td>
                      <td className="p-4 text-white font-semibold">{u.email}</td>
                      <td className="p-4">{getRoleBadge(u.role)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {u.is_active ? "Activo" : "Bloqueado"}
                        </span>
                      </td>
                      {/* Control de roles */}
                      <td className="p-4 text-center">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'manager' | 'operator' | 'user')}
                          disabled={user?.email === u.email}
                          className="rounded-lg border border-slate-800 bg-slate-900 py-1 px-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:opacity-40"
                        >
                          <option value="operator">Operator</option>
                          <option value="manager">Manager</option>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      {/* Desactivar / Activar */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleUserActive(u.id, u.email)}
                          disabled={user?.email === u.email}
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${u.is_active ? 'bg-rose-950/40 text-rose-400 border border-rose-900 hover:bg-rose-600 hover:text-white' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900 hover:bg-emerald-600 hover:text-white'} disabled:opacity-25`}
                        >
                          {u.is_active ? (
                            <>
                              <UserMinus size={12} /> Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} /> Activar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      {adjustModalOpen && productToAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Ajuste de Inventario</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-white"><XCircle size={18} /></button>
            </div>
            
            <p className="text-xs text-slate-400 mb-3">
              Producto: <span className="font-semibold text-emerald-400">{productToAdjust.name}</span>
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Stock Físico Actual: <span className="font-semibold text-white">{productToAdjust.inventory?.quantity ?? 0}</span>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Cantidad a ajustar</label>
                <input 
                  type="number"
                  required
                  placeholder="Ej. +10 o -3"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  value={adjustQtyInput}
                  onChange={e => setAdjustQtyInput(e.target.value)}
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Usa valores positivos (+) para ingresos/reabastecimientos y negativos (-) para mermas o diferencias físicas en bodega.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setAdjustModalOpen(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={adjustStockMutation.isPending} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md disabled:opacity-50">
                  {adjustStockMutation.isPending ? 'Procesando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
