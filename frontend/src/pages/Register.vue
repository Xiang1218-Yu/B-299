<template>
  <section class="max-w-md mx-auto p-4 space-y-6">
    <h2 class="text-2xl font-semibold text-center">用户注册</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4 bg-white p-6 rounded shadow-sm">
      <div>
        <label class="block text-sm text-gray-600 mb-1">用户名</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="请输入用户名"
          class="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">邮箱</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="请输入邮箱"
          class="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">密码</label>
        <input
          v-model="form.password"
          type="password"
          placeholder="请输入密码（至少6位）"
          class="w-full px-3 py-2 border rounded"
          required
          minlength="6"
        />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">确认密码</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          class="w-full px-3 py-2 border rounded"
          required
          minlength="6"
        />
      </div>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

      <button
        type="submit"
        class="w-full px-4 py-2 rounded bg-black text-white"
        :disabled="submitting"
      >
        {{ submitting ? "注册中..." : "注册" }}
      </button>

      <div class="text-center text-sm text-gray-500">
        已有账号？
        <router-link to="/login" class="text-blue-600 hover:underline">立即登录</router-link>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const submitting = ref(false);
const error = ref("");

/**
 * 处理注册提交
 */
async function handleSubmit(): Promise<void> {
  error.value = "";

  // 校验密码一致性
  if (form.password !== form.confirmPassword) {
    error.value = "两次输入的密码不一致";
    return;
  }

  submitting.value = true;

  const result = await auth.register(form.name, form.email, form.password);

  if (result.success) {
    router.push("/orders");
  } else {
    error.value = result.message || "注册失败";
  }

  submitting.value = false;
}
</script>
