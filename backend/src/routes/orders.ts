import { FastifyPluginAsync, FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "../lib/db";
import { z } from "zod";
import type { Product, Prisma } from "@prisma/client";

const orderSchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  address: z.string().min(5),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive() })).min(1),
});

type OrderBody = {
  customerName: string;
  email: string;
  address: string;
  items: { productId: number; quantity: number }[];
};

export const ordersRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 订单列表接口：按 email 筛选当前用户订单，按创建时间倒序返回，支持分页
  app.get("/", async (req: FastifyRequest<{ Querystring: { page?: string; limit?: string; email?: string } }>) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // 根据 email 筛选订单，防止数据越权：未传 email 时返回空列表
    const where = req.query.email ? { email: req.query.email } : {};
    if (!req.query.email) {
      return { items: [], page, limit, total: 0 };
    }

    // 按创建时间倒序查询当前用户的订单列表
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, page, limit, total };
  });

  // 创建订单接口：校验商品库存，事务创建订单及扣减库存
  app.post("/", async (req: FastifyRequest<{ Body: OrderBody }>) => {
    const body = orderSchema.parse(req.body);

    const products: Product[] = await prisma.product.findMany({
      where: { id: { in: body.items.map((i: { productId: number; quantity: number }) => i.productId) } },
    });

    if (products.length !== body.items.length) {
      (req as any).raw.statusCode = 400;
      return { message: "Invalid product in order" };
    }

    let totalCents = 0;
    for (const item of body.items as { productId: number; quantity: number }[]) {
      const p = products.find((pp: Product) => pp.id === item.productId)!;
      if (p.stock < item.quantity) {
        (req.raw as any).statusCode = 400;
        return { message: `Insufficient stock for product ${p.name}` };
      }
      totalCents += p.priceCents * item.quantity;
    }

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.order.create({
        data: {
          customerName: body.customerName,
          email: body.email,
          address: body.address,
          totalCents,
        },
      });

      for (const item of body.items as { productId: number; quantity: number }[]) {
        const p = products.find((pp: Product) => pp.id === item.productId)!;
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

    return { id: order.id, totalCents };
  });

  // 订单详情接口：根据订单 ID 查询订单及其关联的商品条目，需校验 email 防越权
  app.get("/:id", async (req: FastifyRequest<{ Params: { id: string }; Querystring: { email?: string } }>) => {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      (req.raw as any).statusCode = 404;
      return { message: "Order not found" };
    }
    // 校验 email：未传 email 或 email 不匹配时拒绝访问，防止越权查看他人订单
    if (!req.query.email || order.email !== req.query.email) {
      (req.raw as any).statusCode = 403;
      return { message: "Forbidden" };
    }
    return order;
  });
};
