import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../lib/api";
import type { User, AuthResponse } from "../lib/types";

// localStorage 中存储 token 的 key
const TOKEN_KEY = "mall_token";
const USER_KEY = "mall_user";

export const useAuthStore = defineStore("auth", () => {
  // 当前用户信息
  const user = ref<User | null>(null);

  // JWT token
  const token = ref<string | null>(null);

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value && !!user.value);

  // 初始化：从 localStorage 恢复登录状态
  function init() {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      token.value = savedToken;
      user.value = JSON.parse(savedUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
  }

  // 设置登录状态
  function setAuth(data: AuthResponse) {
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  }

  // 清除登录状态
  function clearAuth() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common["Authorization"];
  }

  // 用户注册
  async function register(name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", { name, email, password });
      setAuth(data);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "注册失败",
      };
    }
  }

  // 用户登录
  async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
      setAuth(data);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "登录失败",
      };
    }
  }

  // 用户登出
  function logout() {
    clearAuth();
  }

  return {
    user,
    token,
    isLoggedIn,
    init,
    register,
    login,
    logout,
  };
});
