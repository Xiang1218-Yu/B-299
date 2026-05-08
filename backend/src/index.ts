import Fastify, { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { productsRoutes } from "./routes/products";
import { categoriesRoutes } from "./routes/categories";
import { ordersRoutes } from "./routes/orders";

const server = Fastify({ logger: true });

server.register(cors, { origin: true });

server.register(async (instance: FastifyInstance) => {
  instance.register(productsRoutes, { prefix: "/api/products" });
  instance.register(categoriesRoutes, { prefix: "/api/categories" });
  instance.register(ordersRoutes, { prefix: "/api/orders" });
});

server.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  request.log.error({ err: error }, "request error");
  const status = (error as any).statusCode || 500;
  reply.code(status).send({ message: error.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 8000);
server
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    server.log.info(`backend listening on ${port}`);
  })
  .catch((err: unknown) => {
    server.log.error(err);
    process.exit(1);
  });
