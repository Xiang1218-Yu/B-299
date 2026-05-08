<template>
  <section class="max-w-3xl mx-auto p-4 space-y-6">
    <h2 class="text-2xl font-semibold">结算</h2>
    <form @submit.prevent="submit" class="space-y-4 bg-white p-6 rounded shadow-sm">
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">姓名</label>
          <input v-model="form.customerName" class="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">邮箱</label>
          <input v-model="form.email" class="w-full px-3 py-2 border rounded" />
        </div>
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">地址</label>
        <input v-model="form.address" class="w-full px-3 py-2 border rounded" />
      </div>

      <div class="flex items-center justify-between">
        <div>应付：<span class="font-bold">¥ {{ (totalCents/100).toFixed(2) }}</span></div>
        <button class="px-4 py-2 rounded bg-black text-white" :disabled="submitting">提交订单</button>
      </div>
      <p v-if="error" class="text-red-600">{{ error }}</p>
      <p v-if="orderId" class="text-green-600">订单创建成功，编号：{{ orderId }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import { useCartStore } from "../store/cart";
import { api } from "../lib/api";
import { checkoutSchema } from "../lib/validation";

const cart = useCartStore();
const { items, totalCents } = storeToRefs(cart);
const form = reactive({ customerName: "", email: "", address: "" });
const submitting = ref(false);
const error = ref("");
const orderId = ref<number | null>(null);

async function submit() {
  error.value = "";
  const parsed = checkoutSchema.safeParse(form);
  if (!parsed.success) {
    error.value = "信息不完整或格式错误";
    return;
  }
  if (items.value.length === 0) {
    error.value = "购物车为空";
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      ...parsed.data,
      items: items.value.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    };
    const { data } = await api.post<{ id: number }>("/orders", payload);
    orderId.value = data.id;
    // 下单成功后将 email 存入 localStorage，用于订单列表查询的身份标识
    localStorage.setItem("userEmail", form.email);
    cart.clear();
  } catch (e: any) {
    error.value = e?.response?.data?.message || "下单失败";
  } finally {
    submitting.value = false;
  }
}
</script>

