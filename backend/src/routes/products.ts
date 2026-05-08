import { FastifyPluginAsync, FastifyRequest, FastifyInstance } from "fastify";
import { prisma } from "../lib/db";
import { z } from "zod";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  categoryId: z.string().optional(),
  q: z.string().optional(),
});

type Query = {
  page?: string;
  limit?: string;
  categoryId?: string;
  q?: string;
};

export const productsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/", async (req: FastifyRequest<{ Querystring: Query }>) => {
    const parsed = querySchema.parse(req.query);
    const page = parsed.page ? parseInt(parsed.page, 10) : 1;
    const limit = parsed.limit ? parseInt(parsed.limit, 10) : 12;
    const skip = (page - 1) * limit;
    const categoryId = parsed.categoryId ? parseInt(parsed.categoryId, 10) : undefined;
    const q = parsed.q?.trim();

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (q) where.OR = [
      { name: { contains: q } },
      { description: { contains: q }  },
    ];

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, page, limit, total };
  });

  app.get("/:id", async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const id = parseInt(req.params.id, 10);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      (req.raw as any).statusCode = 404;
      return { message: "Product not found" };
    }
    return product;
  });
};
