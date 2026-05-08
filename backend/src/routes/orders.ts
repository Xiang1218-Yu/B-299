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

  app.get("/:id", async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      (req.raw as any).statusCode = 404;
      return { message: "Order not found" };
    }
    return order;
  });
};
