"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const products_1 = require("./routes/products");
const categories_1 = require("./routes/categories");
const orders_1 = require("./routes/orders");
const server = (0, fastify_1.default)({ logger: true });
server.register(cors_1.default, { origin: true });
server.register(async (instance) => {
    instance.register(products_1.productsRoutes, { prefix: "/api/products" });
    instance.register(categories_1.categoriesRoutes, { prefix: "/api/categories" });
    instance.register(orders_1.ordersRoutes, { prefix: "/api/orders" });
});
server.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request error");
    const status = error.statusCode || 500;
    reply.code(status).send({ message: error.message || "Internal Server Error" });
});
const port = Number(process.env.PORT || 8000);
server
    .listen({ port, host: "0.0.0.0" })
    .then(() => {
    server.log.info(`backend listening on ${port}`);
})
    .catch((err) => {
    server.log.error(err);
    process.exit(1);
});
