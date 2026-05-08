import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { useAuthStore } from "./store/auth";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// 初始化认证状态（从 localStorage 恢复）
const auth = useAuthStore();
auth.init();

app.mount("#app");

