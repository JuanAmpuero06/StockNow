export interface Inventory {
  quantity: number;
  reserved_quantity: number;
  available_stock: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  inventory: Inventory | null;
}