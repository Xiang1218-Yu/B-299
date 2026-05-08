<template>
  <section class="max-w-4xl mx-auto p-4 space-y-6">
    <h2 class="text-2xl font-semibold">我的订单</h2>

    <!-- 无 email 时显示输入引导 -->
    <div v-if="!userEmail" class="bg-white rounded shadow-sm p-6 space-y-4">
      <p class="text-gray-600">请输入您的邮箱查看订单</p>
      <form @submit.prevent="setEmail" class="flex gap-2">
        <input
          v-model="emailInput"
          type="email"
          placeholder="请输入下单时使用的邮箱"
          class="flex-1 px-3 py-2 border rounded"
        />
        <button type="submit" class="px-4 py-2 rounded bg-black text-white">查询</button>
      </form>
      <p v-if="emailError" class="text-red-600 text-sm">{{ emailError }}</p>
    </div>

    <template v-else>
      <!-- 当前用户标识及切换 -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">当前用户：{{ userEmail }}</span>
        <button class="text-sm text-blue-600 hover:underline" @click="switchEmail">切换账号</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-10 text-gray-500">加载中...</div>

      <!-- 空状态 -->
      <div v-else-if="!orders || orders.length === 0" class="text-center py-10 text-gray-500">暂无订单</div>

      <!-- 订单列表 -->
      <div v-else class="space-y-3">
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white rounded shadow-sm p-4 flex items-center justify-between hover:shadow-md transition cursor-pointer"
          @click="goDetail(order.id)"
        >
          <div class="space-y-1">
            <!-- 订单号 -->
            <div class="text-sm text-gray-500">
              订单号：<span class="text-gray-900 font-medium">{{ order.id }}</span>
            </div>
            <!-- 下单时间 -->
            <div class="text-sm text-gray-500">
              时间：<span class="text-gray-700">{{ formatDate(order.createdAt) }}</span>
            </div>
            <!-- 客户姓名 -->
            <div class="text-sm text-gray-500">
              客户：<span class="text-gray-700">{{ order.customerName }}</span>
            </div>
          </div>
          <!-- 金额 -->
          <div class="text-right space-y-2">
            <div class="text-lg font-bold">¥{{ (order.totalCents / 100).toFixed(2) }}</div>
            <span class="text-xs text-blue-600 hover:underline">查看详情 →</span>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 pt-4">
        <button
          class="px-3 py-1 rounded border text-sm disabled:opacity-40"
          :disabled="currentPage <= 1"
          @click="loadPage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="text-sm text-gray-600">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="px-3 py-1 rounded border text-sm disabled:opacity-40"
          :disabled="currentPage >= totalPages"
          @click="loadPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { fetchOrders } from "../lib/api";
import type { Order } from "../lib/types";

const router = useRouter();

// 当前用户 email，从 localStorage 读取
const userEmail = ref("");
const emailInput = ref("");
const emailError = ref("");

// 订单列表数据
const orders = ref<Order[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const total = ref(0);
const pageSize = 10;

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize));

// 格式化时间显示
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 设置 email 并保存到 localStorage，随后加载订单
function setEmail() {
  emailError.value = "";
  const trimmed = emailInput.value.trim();
  if (!trimmed || !trimmed.includes("@")) {
    emailError.value = "请输入有效的邮箱地址";
    return;
  }
  userEmail.value = trimmed;
  localStorage.setItem("userEmail", trimmed);
  loadPage(1);
}

// 切换账号：清除当前 email，显示输入框
function switchEmail() {
  userEmail.value = "";
  emailInput.value = "";
  orders.value = [];
  total.value = 0;
}

// 加载指定页码的订单数据，传 email 防越权
async function loadPage(page: number) {
  loading.value = true;
  try {
    const result = await fetchOrders(page, pageSize, userEmail.value);
    // 防御性处理：确保 items 始终为数组，避免 undefined 导致模板 .length 报错
    orders.value = Array.isArray(result?.items) ? result.items : [];
    total.value = result?.total ?? 0;
    currentPage.value = result?.page ?? page;
  } catch {
    orders.value = [];
  } finally {
    loading.value = false;
  }
}

// 跳转到订单详情页
function goDetail(id: number) {
  router.push(`/orders/${id}`);
}

onMounted(() => {
  // 从 localStorage 恢复用户 email
  const stored = localStorage.getItem("userEmail") || "";
  if (stored) {
    userEmail.value = stored;
    loadPage(1);
  }
});
</script>
