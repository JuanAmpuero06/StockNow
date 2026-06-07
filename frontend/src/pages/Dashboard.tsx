import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import { ProductModal } from '../components/ProductModal';
import { CartPanel } from '../components/CartPanel';
import { Plus, Pencil, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import type { Product } from '../types/product';

interface CartItem {
  product: Product;
  quantity: number;
}

export const Dashboard: React.FC = () => {
  const { data: products, isLoading, isError, error } = useProducts(0, 10);
  const deleteMutation = useDeleteProduct();
  
  // Estados de Control de Modales y Paneles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Estado del Carrito
  const [cart, setCart] = useState<CartItem[]>([]);

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

  const handleAddToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      const currentQtyInCart = existing ? existing.quantity : 0;
      const available = product.inventory?.available_stock ?? 0;

      // Validación en el frontend para no añadir más del stock disponible real
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

  const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-900"><div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;
  if (isError) return <div className="flex h-screen items-center justify-center bg-slate-900 text-red-400"><p>Error: {(error as Error).message}</p></div>;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">StockNow Dashboard</h1>
          <p className="text-sm text-slate-400">Control de inventario y órdenes en tiempo real</p>
        </div>
        <div className="flex gap-4">
          {/* Botón indicador del Carrito */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            <ShoppingCart size={18} /> Carrito Comercial
            {totalItemsInCart > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                {totalItemsInCart}
              </span>
            )}
          </button>
          
          <button onClick={handleOpenCreate} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500">
            <Plus size={18} /> Agregar Producto
          </button>
        </div>
      </header>

      {/* Tabla Unificada de Operaciones e Inventario */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase text-slate-400">
              <th className="p-4">SKU</th>
              <th className="p-4">Producto</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Stock Físico</th>
              <th className="p-4">Reservado</th>
              <th className="p-4">Disponible</th>
              <th className="p-4 text-center">Venta</th>
              <th className="p-4 text-center">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {products?.map((product) => (
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
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${(product.inventory?.available_stock ?? 0) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {product.inventory?.available_stock ?? 0} unidades
                  </span>
                </td>
                {/* Acción de Venta / Carrito */}
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleAddToCart(product)}
                    disabled={(product.inventory?.available_stock ?? 0) <= 0}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all disabled:opacity-20"
                  >
                    <ShoppingBag size={12} /> Añadir
                  </button>
                </td>
                {/* Acciones de Gestión CRUD */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => handleOpenEdit(product)} className="p-1 text-slate-400 hover:text-amber-400 transition-colors" title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modales Inyectados */}
      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} productToEdit={selectedProduct} />
      
      <CartPanel 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cart}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={() => setCart([])}
      />
    </div>
  );
};
