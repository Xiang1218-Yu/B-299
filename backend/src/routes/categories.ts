import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/db";

export const categoriesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/", async () => {
    const cats = await prisma.category.findMany({ orderBy: { id: "asc" } });
    return cats;
  });
};
