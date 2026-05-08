import Fastify, { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { productsRoutes } from "./routes/products";
import { categoriesRoutes } from "./routes/categories";
import { ordersRoutes } from "./routes/orders";
import { authRoutes } from "./routes/auth";
import { JWT_SECRET } from "./lib/auth";

const server = Fastify({ logger: true });

server.register(cors, { origin: true });

// 注册 JWT 插件
server.register(fastifyJwt, {
  secret: JWT_SECRET,
});

// 定义认证中间件装饰器
server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ message: "未登录或登录已过期" });
  }
});

server.register(async (instance: FastifyInstance) => {
  instance.register(productsRoutes, { prefix: "/api/products" });
  instance.register(categoriesRoutes, { prefix: "/api/categories" });
  instance.register(ordersRoutes, { prefix: "/api/orders" });
  instance.register(authRoutes, { prefix: "/api/auth" });
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
