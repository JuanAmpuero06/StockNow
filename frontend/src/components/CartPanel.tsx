import React from 'react';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { ShoppingCart, Trash2, X } from 'lucide-react';
import type { Product } from '../types/product';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ isOpen, onClose, cartItems, onRemoveItem, onClearCart }) => {
  const { mutate, isPending, error } = useCreateOrder();

  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    const payload = {
      items: cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    };

    mutate(payload, {
      onSuccess: () => {
        alert("¡Orden procesada con éxito en PostgreSQL! El stock ha sido reservado. 🚀");
        onClearCart();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 p-6 flex flex-col text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-emerald-400" size={22} />
            <h2 className="text-xl font-bold text-white">Carrito de Órdenes</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {(error as any).response?.data?.detail || "Error al procesar la transacción masiva."}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-slate-500 text-center pt-10 text-sm">El carrito está vacío.</p>
          ) : (
            cartItems.map(item => (
              <div key={item.product.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/60">
                <div>
                  <h4 className="font-semibold text-white text-sm">{item.product.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">{item.product.sku} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-emerald-400">${(item.product.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => onRemoveItem(item.product.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-slate-800 pt-4 mt-4 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Total:</span>
              <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} disabled={isPending} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg transition-colors disabled:opacity-50">
              {isPending ? 'Reservando Stock en BD...' : 'Confirmar Orden'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};