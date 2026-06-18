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
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

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
    setValidationErrors({});
  }, [productToEdit, isOpen]);

  const isEditing = !!productToEdit;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const serverError = createMutation.error || updateMutation.error;

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!isEditing) {
      if (!formData.sku.trim()) {
        errors.sku = 'El SKU es obligatorio.';
      } else if (!/^[a-zA-Z0-9_-]{3,50}$/.test(formData.sku.trim())) {
        errors.sku = 'El SKU debe tener entre 3 y 50 caracteres (solo letras, números, guiones y guiones bajos).';
      }
    }

    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio.';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres.';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder los 100 caracteres.';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'La descripción no puede exceder los 500 caracteres.';
    }

    const priceNum = parseFloat(formData.price);
    if (!formData.price.trim()) {
      errors.price = 'El precio es obligatorio.';
    } else if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'El precio debe ser un número mayor a 0.';
    }

    if (!isEditing) {
      const stockNum = parseInt(formData.initial_stock, 10);
      if (!formData.initial_stock.trim()) {
        errors.initial_stock = 'El stock inicial es obligatorio.';
      } else if (isNaN(stockNum) || stockNum < 0) {
        errors.initial_stock = 'El stock inicial debe ser un número entero mayor o igual a 0.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: parseFloat(formData.price),
    };

    if (isEditing && productToEdit) {
      updateMutation.mutate({ id: productToEdit.id, payload }, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate({
        ...payload,
        sku: formData.sku.trim(),
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
      {serverError && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
          {(serverError as any).response?.data?.detail || "Ocurrió un error al procesar el producto en el servidor."}
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
            onChange={e => {
              setFormData({...formData, sku: e.target.value});
              if (validationErrors.sku) setValidationErrors({...validationErrors, sku: ''});
            }}
            placeholder="Ej: PROD-1001"
            className={isEditing ? 'opacity-50' : ''}
            error={validationErrors.sku}
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
            onChange={e => {
              setFormData({...formData, name: e.target.value});
              if (validationErrors.name) setValidationErrors({...validationErrors, name: ''});
            }}
            placeholder="Ej: Monitor LED 24 pulgadas"
            error={validationErrors.name}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Descripción
          </label>
          <textarea
            className={`w-full rounded-xl border bg-zinc-900/50 p-3 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:bg-zinc-900 focus:outline-hidden focus:ring-1 ${
              validationErrors.description 
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' 
                : 'border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500'
            } h-20`}
            value={formData.description}
            onChange={e => {
              setFormData({...formData, description: e.target.value});
              if (validationErrors.description) setValidationErrors({...validationErrors, description: ''});
            }}
            placeholder="Escribe una descripción opcional del producto..."
          />
          {validationErrors.description && (
            <p className="mt-1 text-xs text-rose-400 font-medium">{validationErrors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Precio ($)"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={e => {
                setFormData({...formData, price: e.target.value});
                if (validationErrors.price) setValidationErrors({...validationErrors, price: ''});
              }}
              placeholder="0.00"
              error={validationErrors.price}
            />
          </div>
          <div>
            <Input
              label="Stock Físico Inicial"
              type="number"
              disabled={isEditing}
              required
              value={formData.initial_stock}
              onChange={e => {
                setFormData({...formData, initial_stock: e.target.value});
                if (validationErrors.initial_stock) setValidationErrors({...validationErrors, initial_stock: ''});
              }}
              placeholder="0"
              className={isEditing ? 'opacity-50' : ''}
              error={validationErrors.initial_stock}
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
