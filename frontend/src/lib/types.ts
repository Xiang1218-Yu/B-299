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

