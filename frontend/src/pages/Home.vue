<template>
  <section class="max-w-6xl mx-auto p-4 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">精选商品</h2>
      <div class="flex gap-2">
        <select v-model="selectedCategory" @change="fetchProducts()" class="px-3 py-2 border rounded">
          <option :value="undefined">全部分类</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="keyword" placeholder="搜索商品" class="px-3 py-2 border rounded" />
        <button @click="fetchProducts()" class="px-4 py-2 rounded bg-black text-white">搜索</button>
      </div>
    </div>

    <div v-if="loading" class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="animate-pulse bg-gray-200 h-64 rounded"></div>
    </div>
    <div v-else class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "../lib/api";
import type { Product, Category } from "../lib/types";
import ProductCard from "../components/ProductCard.vue";

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const selectedCategory = ref<number | undefined>(undefined);
const keyword = ref("");
const loading = ref(true);

async function fetchCategories() {
  const { data } = await api.get<Category[]>("/categories");
  categories.value = data;
}

async function fetchProducts() {
  loading.value = true;
  const { data } = await api.get<{ items: Product[] }>("/products", {
    params: {
      categoryId: selectedCategory.value,
      q: keyword.value || undefined,
    },
  });
  products.value = data.items;
  loading.value = false;
}

onMounted(async () => {
  await fetchCategories();
  await fetchProducts();
});
</script>

