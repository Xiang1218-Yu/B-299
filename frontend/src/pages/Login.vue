<template>
  <section class="max-w-md mx-auto p-4 space-y-6">
    <h2 class="text-2xl font-semibold text-center">用户登录</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4 bg-white p-6 rounded shadow-sm">
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
          placeholder="请输入密码"
          class="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

      <button
        type="submit"
        class="w-full px-4 py-2 rounded bg-black text-white"
        :disabled="submitting"
      >
        {{ submitting ? "登录中..." : "登录" }}
      </button>

      <div class="text-center text-sm text-gray-500">
        还没有账号？
        <router-link to="/register" class="text-blue-600 hover:underline">立即注册</router-link>
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
  email: "",
  password: "",
});

const submitting = ref(false);
const error = ref("");

/**
 * 处理登录提交
 */
async function handleSubmit(): Promise<void> {
  error.value = "";
  submitting.value = true;

  const result = await auth.login(form.email, form.password);

  if (result.success) {
    router.push("/orders");
  } else {
    error.value = result.message || "登录失败";
  }

  submitting.value = false;
}
</script>
