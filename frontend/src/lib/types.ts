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
  totalPages: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

// 订单项类型
export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitCents: number;
};

// 订单类型
export type Order = {
  id: number;
  createdAt: string;
  totalCents: number;
  customerName: string;
  email: string;
  address: string;
  items?: OrderItem[];
};

