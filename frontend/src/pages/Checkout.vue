<template>
  <section class="max-w-3xl mx-auto p-4 space-y-6">
    <h2 class="text-2xl font-semibold">结算</h2>

    <!-- 未登录提示 -->
    <div v-if="!auth.isLoggedIn" class="bg-yellow-50 border border-yellow-200 rounded p-4">
      <p class="text-yellow-800">请先登录后结算</p>
      <div class="mt-3 flex gap-3">
        <router-link to="/login" class="px-4 py-2 rounded bg-black text-white">登录</router-link>
        <router-link to="/register" class="px-4 py-2 rounded bg-gray-200 text-gray-700">注册</router-link>
      </div>
    </div>

    <form v-else @submit.prevent="submit" class="space-y-4 bg-white p-6 rounded shadow-sm">
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">姓名</label>
          <input v-model="form.customerName" class="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">邮箱</label>
          <input v-model="form.email" type="email" class="w-full px-3 py-2 border rounded" />
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
      <div v-if="orderId" class="space-y-2">
        <p class="text-green-600">订单创建成功，编号：{{ orderId }}</p>
        <div class="flex gap-4">
          <router-link :to="`/order/${orderId}`" class="px-4 py-2 rounded bg-blue-600 text-white">查看订单详情</router-link>
          <router-link to="/orders" class="px-4 py-2 rounded bg-gray-200 text-gray-700">查看订单列表</router-link>
        </div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCartStore } from "../store/cart";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { checkoutSchema } from "../lib/validation";

const router = useRouter();
const cart = useCartStore();
const auth = useAuthStore();

const { items, totalCents } = storeToRefs(cart);

const form = reactive({
  customerName: "",
  email: "",
  address: "",
});

const submitting = ref(false);
const error = ref("");
const orderId = ref<number | null>(null);

/**
 * 初始化表单（预填用户信息）
 */
function initForm(): void {
  if (auth.user) {
    form.customerName = auth.user.name;
    form.email = auth.user.email;
  }
}

/**
 * 提交订单
 */
async function submit(): Promise<void> {
  error.value = "";

  if (!auth.isLoggedIn) {
    error.value = "请先登录";
    return;
  }

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
    cart.clear();
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 401) {
      auth.logout();
      router.push("/login");
    } else {
      error.value = e?.response?.data?.message || "下单失败";
    }
  } finally {
    submitting.value = false;
  }
}

// 组件挂载时初始化
onMounted(() => {
  initForm();
});

// 监听登录状态变化
watch(
  () => auth.isLoggedIn,
  () => {
    if (auth.isLoggedIn) {
      initForm();
    }
  }
);
</script>
