<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <router-link to="/" class="text-xl font-semibold">商城系统</router-link>
        <nav class="flex items-center gap-4">
          <router-link to="/cart" class="px-3 py-2 rounded hover:bg-gray-100">购物车</router-link>
          <router-link to="/orders" class="px-3 py-2 rounded hover:bg-gray-100">我的订单</router-link>
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
    <footer class="border-t bg-white">
      <div class="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500">© Mall</div>
    </footer>
  </div>
  </template>

<script setup lang="ts"></script>

