<template>
  <section class="max-w-4xl mx-auto p-4 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">订单列表</h2>
      <div class="flex items-center gap-3">
        <router-link to="/" class="px-4 py-2 rounded bg-gray-200 text-gray-700">
          去购物
        </router-link>
      </div>
    </div>

    <!-- 未登录提示 -->
    <div v-if="!auth.isLoggedIn" class="bg-yellow-50 border border-yellow-200 rounded p-4">
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
      <div v-else-if="error" class="text-red-600">{{ error }}</div>

      <!-- 空状态 -->
      <div v-else-if="orders.length === 0" class="text-gray-500">暂无订单</div>

      <!-- 订单列表 -->
      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.id"
          class="flex items-center justify-between bg-white rounded p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
          @click="goToDetail(order.id)"
        >
          <div class="space-y-2">
            <div class="font-medium">
              订单号：<span class="text-gray-700">#{{ order.id }}</span>
            </div>
            <div class="text-sm text-gray-500">
              时间：{{ formatDate(order.createdAt) }}
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg">¥ {{ (order.totalCents / 100).toFixed(2) }}</div>
            <div class="text-sm text-gray-500">查看详情 →</div>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
        <button
          @click="goToPage(page - 1)"
          :disabled="page <= 1"
          class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          上一页
        </button>
        <span class="text-sm text-gray-600">
          第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条
        </span>
        <button
          @click="goToPage(page + 1)"
          :disabled="page >= totalPages"
          class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          下一页
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import type { Order, Paged } from "../lib/types";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

// 每页数量
const PAGE_SIZE = 10;

// 订单列表
const orders = ref<Order[]>([]);

// 分页信息
const page = ref(1);
const total = ref(0);
const totalPages = ref(0);

// 状态
const loading = ref(false);
const error = ref("");

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
  });
}

/**
 * 跳转到订单详情页
 */
function goToDetail(orderId: number): void {
  router.push(`/order/${orderId}`);
}

/**
 * 切换页码
 */
function goToPage(targetPage: number): void {
  if (targetPage < 1 || targetPage > totalPages.value) {
    return;
  }
  page.value = targetPage;
  router.push({ query: { page: targetPage.toString() } });
}

/**
 * 获取订单列表
 */
async function fetchOrders(): Promise<void> {
  if (!auth.isLoggedIn) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get<Paged<Order>>("/orders", {
      params: {
        page: page.value,
        limit: PAGE_SIZE,
      },
    });

    orders.value = data.items;
    total.value = data.total;
    totalPages.value = data.totalPages;
  } catch (err: any) {
    console.error("获取订单列表失败:", err);
    if (err?.response?.status === 401) {
      auth.logout();
      router.push("/login");
    } else {
      error.value = err?.response?.data?.message || "获取订单列表失败";
    }
  } finally {
    loading.value = false;
  }
}

/**
 * 从 URL 参数初始化页码
 */
function initPageFromQuery(): void {
  const pageParam = route.query.page as string;
  if (pageParam && /^\d+$/.test(pageParam)) {
    const parsed = parseInt(pageParam, 10);
    if (parsed >= 1) {
      page.value = parsed;
    }
  }
}

// 组件挂载时初始化
onMounted(() => {
  initPageFromQuery();
  fetchOrders();
});

// 监听页码变化
watch(page, () => {
  fetchOrders();
});

// 监听登录状态变化
watch(
  () => auth.isLoggedIn,
  () => {
    if (auth.isLoggedIn) {
      fetchOrders();
    }
  }
);
</script>
