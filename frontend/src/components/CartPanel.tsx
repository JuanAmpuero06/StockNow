import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { ShoppingCart, Trash2, X } from 'lucide-react';
import type { Product } from '../types/product';
import { Button } from './ui/Button';

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
        alert("¡Requisición de stock enviada con éxito! El stock ha sido reservado en bodega. 🚀");
        onClearCart();
        onClose();
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-zinc-950/95 border-l border-zinc-800/80 p-6 flex flex-col text-zinc-100 shadow-2xl backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-emerald-400" size={22} />
                <h2 className="text-xl font-bold text-zinc-100">Solicitud de Stock (Requisición)</h2>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors p-1.5 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
                {(error as any).response?.data?.detail || "Error al procesar la transacción masiva."}
              </div>
            )}

            {/* Item List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-20 text-center text-zinc-500">
                  <ShoppingCart size={40} className="stroke-1 mb-2 opacity-50" />
                  <p className="text-sm">La solicitud de stock está vacía.</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.product.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/60 transition-colors duration-300"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-sm">{item.product.name}</h4>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{item.product.sku} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-emerald-400">${(item.product.price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-zinc-800 pt-4 mt-4 space-y-4">
                <div className="flex justify-between items-center text-sm px-1">
                  <span className="text-zinc-400">Valor Estimado:</span>
                  <span className="text-xl font-bold text-zinc-100">${total.toFixed(2)}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  isLoading={isPending}
                  className="w-full py-3"
                  variant="primary"
                >
                  Confirmar Solicitud
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};