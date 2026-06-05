import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductModal } from '../components/ProductModal';
import { Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: products, isLoading, isError, error } = useProducts(0, 10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-red-400">
        <p>Error al cargar el inventario: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">StockNow Dashboard</h1>
          <p className="text-sm text-slate-400">Control de inventario y órdenes en tiempo real</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500"
        >
          <Plus size={18} /> Agregar Producto
        </button>
      </header>

      {/* Tabla de Productos */}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
