import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../pages/Home.vue";
import ProductDetail from "../pages/ProductDetail.vue";
import Cart from "../pages/Cart.vue";
import Checkout from "../pages/Checkout.vue";
import OrderList from "../pages/OrderList.vue";
import OrderDetail from "../pages/OrderDetail.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: Home },
  { path: "/product/:id", component: ProductDetail },
  { path: "/cart", component: Cart },
  { path: "/checkout", component: Checkout },
  { path: "/orders", component: OrderList },
  { path: "/order/:id", component: OrderDetail },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});

