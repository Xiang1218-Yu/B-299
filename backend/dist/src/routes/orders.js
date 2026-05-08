"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRoutes = void 0;
const db_1 = require("../lib/db");
const zod_1 = require("zod");
// 创建订单请求校验
const orderSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(2, "收货人姓名至少2个字符"),
    email: zod_1.z.string().email("邮箱格式错误"),
    address: zod_1.z.string().min(5, "地址至少5个字符"),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.number().int().positive("商品ID必须是正整数"),
        quantity: zod_1.z.number().int().positive("数量必须是正整数"),
    }))
        .min(1, "订单至少包含一个商品"),
});
// 分页查询参数校验
const pageQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
});
// 订单ID参数校验
const orderIdParamSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .refine((val) => /^\d+$/.test(val), "订单ID必须是有效的数字")
        .transform((val) => parseInt(val, 10)),
});
const ordersRoutes = async (app) => {
    /**
     * 获取当前用户ID
     */
    function getCurrentUserId(req) {
        var _a;
        const user = req.user;
        return (_a = user === null || user === void 0 ? void 0 : user.userId) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * 获取订单列表（需要登录）
     * 支持分页，只返回当前用户的订单
     */
    app.get("/", { onRequest: [app.authenticate] }, async (req, reply) => {
        var _a;
        const userId = getCurrentUserId(req);
        if (!userId) {
            return reply.code(401).send({ message: "未登录" });
        }
        // 校验分页参数
        const parsed = pageQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return reply.code(400).send({
                message: ((_a = parsed.error.issues[0]) === null || _a === void 0 ? void 0 : _a.message) || "分页参数错误",
            });
        }
        const { page, limit } = parsed.data;
        const skip = (page - 1) * limit;
        // 查询当前用户的订单总数
        const total = await db_1.prisma.order.count({
            where: { userId },
        });
        // 分页查询订单
        const orders = await db_1.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });
        const totalPages = Math.ceil(total / limit);
        const result = {
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
    app.post("/", { onRequest: [app.authenticate] }, async (req, reply) => {
        var _a;
        const userId = getCurrentUserId(req);
        if (!userId) {
            return reply.code(401).send({ message: "未登录" });
        }
        // 校验请求参数
        const body = orderSchema.safeParse(req.body);
        if (!body.success) {
            return reply.code(400).send({
                message: ((_a = body.error.issues[0]) === null || _a === void 0 ? void 0 : _a.message) || "参数校验失败",
            });
        }
        const { customerName, email, address, items } = body.data;
        // 查询所有商品
        const products = await db_1.prisma.product.findMany({
            where: { id: { in: items.map((i) => i.productId) } },
        });
        if (products.length !== items.length) {
            return reply.code(400).send({ message: "订单中包含无效商品" });
        }
        // 检查库存并计算总价
        let totalCents = 0;
        for (const item of items) {
            const p = products.find((pp) => pp.id === item.productId);
            if (p.stock < item.quantity) {
                return reply.code(400).send({ message: `商品 ${p.name} 库存不足` });
            }
            totalCents += p.priceCents * item.quantity;
        }
        // 事务创建订单
        const order = await db_1.prisma.$transaction(async (tx) => {
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
                const p = products.find((pp) => pp.id === item.productId);
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
    app.get("/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
        var _a;
        const userId = getCurrentUserId(req);
        if (!userId) {
            return reply.code(401).send({ message: "未登录" });
        }
        // 校验订单ID参数
        const parsedParam = orderIdParamSchema.safeParse(req.params);
        if (!parsedParam.success) {
            return reply.code(400).send({
                message: ((_a = parsedParam.error.issues[0]) === null || _a === void 0 ? void 0 : _a.message) || "订单ID无效",
            });
        }
        const orderId = parsedParam.data.id;
        // 查询订单
        const order = await db_1.prisma.order.findUnique({
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
exports.ordersRoutes = ordersRoutes;
