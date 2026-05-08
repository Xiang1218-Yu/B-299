<template>
  <section class="max-w-4xl mx-auto p-4 space-y-6">
    <h2 class="text-2xl font-semibold">购物车</h2>
    <div v-if="items.length === 0" class="text-gray-500">购物车为空</div>
    <div v-else class="space-y-4">
      <div v-for="i in items" :key="i.product.id" class="flex items-center justify-between bg-white rounded p-3 shadow-sm">
        <div class="flex items-center gap-3">
          <img :src="i.product.imageUrl" class="w-16 h-16 object-cover rounded" />
          <div>
            <div class="font-medium">{{ i.product.name }}</div>
            <div class="text-sm text-gray-500">¥ {{ (i.product.priceCents/100).toFixed(2) }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" min="1" v-model.number="i.quantity" @change="update(i.product.id, i.quantity)" class="w-20 px-2 py-1 border rounded" />
          <button @click="remove(i.product.id)" class="px-3 py-1 rounded bg-red-600 text-white">移除</button>
        </div>
      </div>

      <div class="flex items-center justify-between bg-white rounded p-4 shadow-sm">
        <div class="text-lg">总计：<span class="font-bold">¥ {{ (totalCents/100).toFixed(2) }}</span></div>
        <router-link to="/checkout" class="px-4 py-2 rounded bg-black text-white">去结算</router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "../store/cart";
const cart = useCartStore();
const { items, totalCents } = storeToRefs(cart);
function remove(id: number) { cart.remove(id); }
function update(id: number, q: number) { cart.update(id, q); }
</script>

