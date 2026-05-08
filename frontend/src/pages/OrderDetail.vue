<template>
  <section class="max-w-3xl mx-auto p-4 space-y-6">
    <!-- 返回订单列表 -->
    <router-link to="/orders" class="text-sm text-blue-600 hover:underline">← 返回订单列表</router-link>

    <h2 class="text-2xl font-semibold">订单详情</h2>

    <!-- 无 email 时提示返回 -->
    <div v-if="!userEmail" class="text-center py-10 text-gray-500">
      无法验证身份，请先<router-link to="/orders" class="text-blue-600 hover:underline">返回订单列表</router-link>输入邮箱
    </div>

    <template v-else>
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-10 text-gray-500">加载中...</div>

      <!-- 无权限或订单不存在 -->
      <div v-else-if="forbidden" class="text-center py-10 text-red-500">无权查看该订单</div>
      <div v-else-if="!order" class="text-center py-10 text-gray-500">订单不存在</div>

      <!-- 订单详情内容 -->
      <template v-else>
        <!-- 基本信息 -->
        <div class="bg-white rounded shadow-sm p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">订单 #{{ order.id }}</h3>
            <span class="text-lg font-bold">¥{{ (order.totalCents / 100).toFixed(2) }}</span>
          </div>
          <div class="text-sm text-gray-500 space-y-1">
            <div>客户姓名：{{ order.customerName }}</div>
            <div>邮箱：{{ order.email }}</div>
            <div>地址：{{ order.address }}</div>
            <div>下单时间：{{ formatDate(order.createdAt) }}</div>
          </div>
        </div>

        <!-- 商品条目列表 -->
        <div v-if="order.items && order.items.length > 0" class="space-y-2">
          <h3 class="text-lg font-medium">商品明细</h3>
          <div
            v-for="item in order.items"
            :key="item.id"
            class="bg-white rounded shadow-sm p-4 flex items-center justify-between"
          >
            <div>
              <div class="text-sm text-gray-700">商品 ID：{{ item.productId }}</div>
              <div class="text-sm text-gray-500">数量：{{ item.quantity }}</div>
            </div>
            <div class="text-sm font-medium">¥{{ ((item.unitCents * item.quantity) / 100).toFixed(2) }}</div>
          </div>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { fetchOrderDetail } from "../lib/api";
import type { Order } from "../lib/types";

const route = useRoute();

// 订单详情数据
const order = ref<Order | null>(null);
const loading = ref(true);
const forbidden = ref(false);
// 从 localStorage 读取当前用户 email，用于权限校验
const userEmail = ref("");

// 格式化时间显示
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 根据路由参数加载订单详情，传 email 校验权限
onMounted(async () => {
  const stored = localStorage.getItem("userEmail") || "";
  userEmail.value = stored;

  const id = Number(route.params.id);
  if (!id || !stored) {
    loading.value = false;
    return;
  }
  try {
    order.value = await fetchOrderDetail(id, stored);
  } catch (e: any) {
    // 403 表示越权访问
    if (e?.response?.status === 403) {
      forbidden.value = true;
    }
    order.value = null;
  } finally {
    loading.value = false;
  }
});
</script>
