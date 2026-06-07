import React, { useState, useEffect } from 'react';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct'; // Importar nuevo hook
import { X } from 'lucide-react';
import type { Product } from '../types/product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null; // NULL significa Crear, un objeto significa Editar
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, productToEdit }) => {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  
  const [formData, setFormData] = useState({ sku: '', name: '', description: '', price: '', initial_stock: '' });

  // Efecto para rellenar el formulario si vamos a editar
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        sku: productToEdit.sku,
        name: productToEdit.name,
        description: productToEdit.description || '',
        price: productToEdit.price.toString(),
        initial_stock: productToEdit.inventory?.quantity.toString() || '0',
      });
    } else {
      setFormData({ sku: '', name: '', description: '', price: '', initial_stock: '' });
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!productToEdit;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
    };

    if (isEditing && productToEdit) {
      updateMutation.mutate({ id: productToEdit.id, payload }, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate({
        ...payload,
        sku: formData.sku,
        initial_stock: parseInt(formData.initial_stock, 10) || 0,
      }, { onSuccess: () => onClose() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {(error as any).response?.data?.detail || "Ocurrió un error."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">SKU</label>
            <input type="text" disabled={isEditing} required className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-40" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            {isEditing && <span className="text-[11px] text-slate-500">El SKU no se puede modificar por integridad del catálogo.</span>}
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
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Stock Físico</label>
              <input type="number" disabled={isEditing} required className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-40" value={formData.initial_stock} onChange={e => setFormData({...formData, initial_stock: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50">
              {isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
