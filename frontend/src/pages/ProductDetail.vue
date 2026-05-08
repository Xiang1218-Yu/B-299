<template>
  <section class="max-w-4xl mx-auto p-4">
    <div v-if="loading" class="animate-pulse h-80 bg-gray-200 rounded"></div>
    <div v-else-if="product" class="grid md:grid-cols-2 gap-6">
      <img :src="product.imageUrl" class="w-full h-80 object-cover rounded" />
      <div class="space-y-4">
        <h1 class="text-2xl font-semibold">{{ product.name }}</h1>
        <p class="text-gray-600">{{ product.description }}</p>
        <div class="text-xl font-bold">¥ {{ (product.priceCents/100).toFixed(2) }}</div>
        <div class="flex gap-3">
          <input type="number" min="1" v-model.number="qty" class="w-24 px-3 py-2 border rounded" />
          <button class="px-4 py-2 rounded bg-black text-white" @click="addToCart">加入购物车</button>
        </div>
      </div>
    </div>
    <p v-else class="text-red-600">商品不存在</p>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../lib/api";
import type { Product } from "../lib/types";
import { useCartStore } from "../store/cart";

const route = useRoute();
const router = useRouter();
const product = ref<Product | null>(null);
const qty = ref(1);
const loading = ref(true);
const cart = useCartStore();

async function fetchProduct() {
  const id = Number(route.params.id);
  const { data } = await api.get<Product>(`/products/${id}`);
  product.value = data;
  loading.value = false;
}

function addToCart() {
  if (!product.value) return;
  cart.add(product.value, qty.value);
  router.push("/cart");
}

onMounted(fetchProduct);
</script>

