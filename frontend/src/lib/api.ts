import axios from "axios";
import type { Order, Paged } from "./types";

export const api = axios.create({
  baseURL: "/api",
});

// 获取订单列表（按时间倒序，支持分页，需传 email 防越权）
export async function fetchOrders(page = 1, limit = 10, email = ""): Promise<Paged<Order>> {
  const params: Record<string, string | number> = { page, limit };
  if (email) params.email = email;
  const { data } = await api.get<Paged<Order>>("/orders", { params });
  return data;
}

// 获取订单详情（需传 email 校验权限，防止越权查看他人订单）
export async function fetchOrderDetail(id: number, email = ""): Promise<Order> {
  const params: Record<string, string> = {};
  if (email) params.email = email;
  const { data } = await api.get<Order>(`/orders/${id}`, { params });
  return data;
}

