import React, { useState, useEffect } from 'react';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import type { Product } from '../types/product';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null; // NULL means Create, object means Edit
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, productToEdit }) => {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  
  const [formData, setFormData] = useState({ sku: '', name: '', description: '', price: '', initial_stock: '' });

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
          {(error as any).response?.data?.detail || "Ocurrió un error al procesar el producto."}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="SKU (Código Único)"
            type="text"
            disabled={isEditing}
            required
            value={formData.sku}
            onChange={e => setFormData({...formData, sku: e.target.value})}
            placeholder="Ej: PROD-1001"
            className={isEditing ? 'opacity-50' : ''}
          />
          {isEditing && (
            <span className="text-[11px] text-zinc-500 block mt-1">
              El SKU no se puede modificar por integridad del catálogo.
            </span>
          )}
        </div>

        <div>
          <Input
            label="Nombre del Producto"
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Ej: Monitor LED 24 pulgadas"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Descripción
          </label>
          <textarea
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-emerald-500 focus:bg-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 h-20"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Escribe una descripción opcional del producto..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Precio ($)"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div>
            <Input
              label="Stock Físico Inicial"
              type="number"
              disabled={isEditing}
              required
              value={formData.initial_stock}
              onChange={e => setFormData({...formData, initial_stock: e.target.value})}
              placeholder="0"
              className={isEditing ? 'opacity-50' : ''}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
