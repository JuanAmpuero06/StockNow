import React, { useState } from 'react';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { X } from 'lucide-react'; // Usando lucide-react que instalaste

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose }) => {
  const { mutate, isPending, error } = useCreateProduct();
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    initial_stock: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      sku: formData.sku,
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      initial_stock: parseInt(formData.initial_stock, 10) || 0,
    }, {
      onSuccess: () => {
        onClose(); // Cerrar modal si todo sale bien
        setFormData({ sku: '', name: '', description: '', price: '', initial_stock: '' }); // Limpiar
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <h2 className="text-xl font-bold text-white">Nuevo Producto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {(error as any).response?.data?.detail || "Ocurrió un error al guardar."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">SKU</label>
            <input type="text" required className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Nombre</label>
            <input type="text" required className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Descripción</label>
            <textarea className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Precio</label>
              <input type="number" step="0.01" required className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Stock Inicial</label>
              <input type="number" required className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" value={formData.initial_stock} onChange={e => setFormData({...formData, initial_stock: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50">
              {isPending ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};