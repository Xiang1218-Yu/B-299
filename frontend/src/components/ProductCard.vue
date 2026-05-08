<template>
  <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <img :src="product.imageUrl" alt="" class="w-full h-40 object-cover rounded-t-xl" />
    <div class="p-4 space-y-2">
      <h3 class="font-medium line-clamp-1">{{ product.name }}</h3>
      <p class="text-sm text-gray-500 line-clamp-2">{{ product.description }}</p>
      <div class="flex items-center justify-between">
        <span class="text-primary font-semibold">¥ {{ (product.priceCents/100).toFixed(2) }}</span>
        <router-link :to="`/product/${product.id}`" class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">详情</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from "../lib/types";
defineProps<{ product: Product }>();
</script>

