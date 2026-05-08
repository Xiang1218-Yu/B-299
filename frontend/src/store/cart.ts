import { defineStore } from "pinia";
import type { CartItem, Product } from "../lib/types";

export const useCartStore = defineStore("cart", {
  state: () => ({ items: [] as CartItem[] }),
  getters: {
    count: (s: { items: CartItem[] }) => s.items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0),
    totalCents: (s: { items: CartItem[] }) => s.items.reduce((sum: number, i: CartItem) => sum + i.product.priceCents * i.quantity, 0),
  },
  actions: {
    add(product: Product, quantity = 1) {
      const existing = this.items.find((i: CartItem) => i.product.id === product.id);
      if (existing) existing.quantity += quantity;
      else this.items.push({ product, quantity });
    },
    remove(productId: number) {
      this.items = this.items.filter((i: CartItem) => i.product.id !== productId);
    },
    update(productId: number, quantity: number) {
      const existing = this.items.find((i: CartItem) => i.product.id === productId);
      if (existing) existing.quantity = quantity;
    },
    clear() { this.items = []; },
  },
});
