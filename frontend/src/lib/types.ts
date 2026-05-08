export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
  categoryId: number;
};

export type Paged<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

// 订单条目类型，对应后端 OrderItem 模型
export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitCents: number;
};

// 订单类型，对应后端 Order 模型
export type Order = {
  id: number;
  createdAt: string;
  totalCents: number;
  customerName: string;
  email: string;
  address: string;
  items?: OrderItem[];
};

