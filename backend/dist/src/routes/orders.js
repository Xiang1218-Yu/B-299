"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRoutes = void 0;
const db_1 = require("../lib/db");
const zod_1 = require("zod");
const orderSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    address: zod_1.z.string().min(5),
    items: zod_1.z.array(zod_1.z.object({ productId: zod_1.z.number().int().positive(), quantity: zod_1.z.number().int().positive() })).min(1),
});
const ordersRoutes = async (app) => {
    app.post("/", async (req) => {
        const body = orderSchema.parse(req.body);
        const products = await db_1.prisma.product.findMany({
            where: { id: { in: body.items.map((i) => i.productId) } },
        });
        if (products.length !== body.items.length) {
            req.raw.statusCode = 400;
            return { message: "Invalid product in order" };
        }
        let totalCents = 0;
        for (const item of body.items) {
            const p = products.find((pp) => pp.id === item.productId);
            if (p.stock < item.quantity) {
                req.raw.statusCode = 400;
                return { message: `Insufficient stock for product ${p.name}` };
            }
            totalCents += p.priceCents * item.quantity;
        }
        const order = await db_1.prisma.$transaction(async (tx) => {
            const created = await tx.order.create({
                data: {
                    customerName: body.customerName,
                    email: body.email,
                    address: body.address,
                    totalCents,
                },
            });
            for (const item of body.items) {
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
        return { id: order.id, totalCents };
    });
    app.get("/:id", async (req) => {
        const id = parseInt(req.params.id, 10);
        const order = await db_1.prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!order) {
            req.raw.statusCode = 404;
            return { message: "Order not found" };
        }
        return order;
    });
};
exports.ordersRoutes = ordersRoutes;
