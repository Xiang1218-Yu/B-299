<template>
  <section class="max-w-4xl mx-auto p-4 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">订单详情</h2>
      <router-link to="/orders" class="text-blue-600 hover:underline">返回订单列表</router-link>
    </div>

    <!-- 参数错误 -->
    <div v-if="paramError" class="bg-red-50 border border-red-200 rounded p-4">
      <p class="text-red-800">{{ paramError }}</p>
      <router-link to="/orders" class="mt-2 inline-block text-blue-600 hover:underline">
        返回订单列表
      </router-link>
    </div>

    <!-- 未登录提示 -->
    <div v-else-if="!auth.isLoggedIn" class="bg-yellow-50 border border-yellow-200 rounded p-4">
      <p class="text-yellow-800">请先登录后查看订单</p>
      <div class="mt-3 flex gap-3">
        <router-link to="/login" class="px-4 py-2 rounded bg-black text-white">登录</router-link>
        <router-link to="/register" class="px-4 py-2 rounded bg-gray-200 text-gray-700">注册</router-link>
      </div>
    </div>

    <template v-else>
      <!-- 加载状态 -->
      <div v-if="loading" class="text-gray-500">加载中...</div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded p-4">
        <p class="text-red-800">{{ error }}</p>
        <router-link to="/orders" class="mt-2 inline-block text-blue-600 hover:underline">
          返回订单列表
        </router-link>
      </div>

      <!-- 订单详情 -->
      <div v-else-if="order" class="space-y-6">
        <!-- 订单基本信息 -->
        <div class="bg-white rounded p-6 shadow-sm">
          <h3 class="text-lg font-medium mb-4">订单信息</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500">订单号</div>
              <div class="font-medium">#{{ order.id }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">创建时间</div>
              <div class="font-medium">{{ formatDate(order.createdAt) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">收货人</div>
              <div class="font-medium">{{ order.customerName }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">邮箱</div>
              <div class="font-medium">{{ order.email }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500">收货地址</div>
              <div class="font-medium">{{ order.address }}</div>
            </div>
          </div>
        </div>

        <!-- 订单商品列表 -->
        <div class="bg-white rounded p-6 shadow-sm">
          <h3 class="text-lg font-medium mb-4">商品列表</h3>
          <div v-if="order.items && order.items.length > 0" class="space-y-3">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <div class="font-medium">商品ID: {{ item.productId }}</div>
                <div class="text-sm text-gray-500">单价: ¥ {{ (item.unitCents / 100).toFixed(2) }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">数量: {{ item.quantity }}</div>
                <div class="font-medium">¥ {{ ((item.unitCents * item.quantity) / 100).toFixed(2) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500">暂无商品信息</div>
        </div>

        <!-- 订单总金额 -->
        <div class="bg-white rounded p-6 shadow-sm flex justify-between items-center">
          <div class="text-lg font-medium">订单总金额</div>
          <div class="text-2xl font-bold text-red-600">¥ {{ (order.totalCents / 100).toFixed(2) }}</div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import type { Order } from "../lib/types";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

// 订单详情
const order = ref<Order | null>(null);

// 状态
const loading = ref(false);
const error = ref("");
const paramError = ref("");

/**
 * 校验并获取订单ID
 */
function getValidOrderId(): number | null {
  const idParam = route.params.id as string;

  // 校验参数是否存在
  if (!idParam) {
    paramError.value = "订单ID不能为空";
    return null;
  }

  // 校验参数格式
  if (!/^\d+$/.test(idParam)) {
    paramError.value = "订单ID格式无效";
    return null;
  }

  const parsedId = parseInt(idParam, 10);

  // 校验数值范围
  if (parsedId <= 0 || !Number.isInteger(parsedId)) {
    paramError.value = "订单ID必须是正整数";
    return null;
  }

  return parsedId;
}

/**
 * 格式化日期时间
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 获取订单详情
 */
async function fetchOrderDetail(orderId: number): Promise<void> {
  loading.value = true;
  error.value = "";
  order.value = null;

  try {
    const { data } = await api.get<Order>(`/orders/${orderId}`);
    order.value = data;
  } catch (err: any) {
    console.error("获取订单详情失败:", err);
    const status = err?.response?.status;
    const message = err?.response?.data?.message;

    if (status === 401) {
      auth.logout();
      router.push("/login");
    } else if (status === 403) {
      error.value = message || "无权查看此订单";
    } else if (status === 404) {
      error.value = message || "订单不存在";
    } else {
      error.value = message || "获取订单详情失败";
    }
  } finally {
    loading.value = false;
  }
}

/**
 * 初始化
 */
function init(): void {
  paramError.value = "";
  error.value = "";
  order.value = null;

  const orderId = getValidOrderId();
  if (!orderId) {
    return;
  }

  if (auth.isLoggedIn) {
    fetchOrderDetail(orderId);
  }
}

// 组件挂载时初始化
onMounted(() => {
  init();
});

// 监听路由参数变化
watch(
  () => route.params.id,
  () => {
    init();
  }
);

// 监听登录状态变化
watch(
  () => auth.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      const orderId = getValidOrderId();
      if (orderId) {
        fetchOrderDetail(orderId);
      }
    }
  }
);
</script>
