import { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/db";
import { z } from "zod";
import type { Product, Prisma } from "@prisma/client";
import type { JwtPayload } from "../lib/auth";

// 创建订单请求校验
const orderSchema = z.object({
  customerName: z.string().min(2, "收货人姓名至少2个字符"),
  email: z.string().email("邮箱格式错误"),
  address: z.string().min(5, "地址至少5个字符"),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive("商品ID必须是正整数"),
        quantity: z.number().int().positive("数量必须是正整数"),
      })
    )
    .min(1, "订单至少包含一个商品"),
});

// 分页查询参数校验
const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// 订单ID参数校验
const orderIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => /^\d+$/.test(val), "订单ID必须是有效的数字")
    .transform((val) => parseInt(val, 10)),
});

type OrderBody = {
  customerName: string;
  email: string;
  address: string;
  items: { productId: number; quantity: number }[];
};

type PageQuery = {
  page: number;
  limit: number;
};

type OrderIdParam = {
  id: number;
};

// 分页结果类型
type PagedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const ordersRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * 获取当前用户ID
   */
  function getCurrentUserId(req: FastifyRequest): number | null {
    const user = req.user as JwtPayload;
    return user?.userId ?? null;
  }

  /**
   * 获取订单列表（需要登录）
   * 支持分页，只返回当前用户的订单
   */
  app.get("/", { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return reply.code(401).send({ message: "未登录" });
    }

    // 校验分页参数
    const parsed = pageQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        message: parsed.error.issues[0]?.message || "分页参数错误",
      });
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    // 查询当前用户的订单总数
    const total = await prisma.order.count({
      where: { userId },
    });

    // 分页查询订单
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const result: PagedResult<typeof orders[0]> = {
      items: orders,
      page,
      limit,
      total,
      totalPages,
    };

    return result;
  });

  /**
   * 创建订单（需要登录）
   */
  app.post("/", { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return reply.code(401).send({ message: "未登录" });
    }

    // 校验请求参数
    const body = orderSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({
        message: body.error.issues[0]?.message || "参数校验失败",
      });
    }

    const { customerName, email, address, items } = body.data;

    // 查询所有商品
    const products: Product[] = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });

    if (products.length !== items.length) {
      return reply.code(400).send({ message: "订单中包含无效商品" });
    }

    // 检查库存并计算总价
    let totalCents = 0;
    for (const item of items) {
      const p = products.find((pp) => pp.id === item.productId)!;
      if (p.stock < item.quantity) {
        return reply.code(400).send({ message: `商品 ${p.name} 库存不足` });
      }
      totalCents += p.priceCents * item.quantity;
    }

    // 事务创建订单
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.order.create({
        data: {
          customerName,
          email,
          address,
          totalCents,
          userId,
        },
      });

      for (const item of items) {
        const p = products.find((pp) => pp.id === item.productId)!;
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: p.id,
            quantity: item.quantity,
            unitCents: p.priceCents,
          },
        });
        await tx.product.update({
          where: { id: p.id },
          data: { stock: p.stock - item.quantity },
        });
      }

      return created;
    });

    return reply.code(201).send({ id: order.id, totalCents });
  });

  /**
   * 获取订单详情（需要登录，只能查看自己的订单）
   */
  app.get("/:id", { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return reply.code(401).send({ message: "未登录" });
    }

    // 校验订单ID参数
    const parsedParam = orderIdParamSchema.safeParse(req.params);
    if (!parsedParam.success) {
      return reply.code(400).send({
        message: parsedParam.error.issues[0]?.message || "订单ID无效",
      });
    }

    const orderId = parsedParam.data.id;

    // 查询订单
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return reply.code(404).send({ message: "订单不存在" });
    }

    // 检查是否是当前用户的订单
    if (order.userId !== userId) {
      return reply.code(403).send({ message: "无权查看此订单" });
    }

    return order;
  });
};
