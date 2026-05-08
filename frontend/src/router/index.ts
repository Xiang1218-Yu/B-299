import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../pages/Home.vue";
import ProductDetail from "../pages/ProductDetail.vue";
import Cart from "../pages/Cart.vue";
import Checkout from "../pages/Checkout.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: Home },
  { path: "/product/:id", component: ProductDetail },
  { path: "/cart", component: Cart },
  { path: "/checkout", component: Checkout },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});

