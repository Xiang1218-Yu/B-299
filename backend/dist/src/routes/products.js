"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRoutes = void 0;
const db_1 = require("../lib/db");
const zod_1 = require("zod");
const querySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional(),
    q: zod_1.z.string().optional(),
});
const productsRoutes = async (app) => {
    app.get("/", async (req) => {
        var _a;
        const parsed = querySchema.parse(req.query);
        const page = parsed.page ? parseInt(parsed.page, 10) : 1;
        const limit = parsed.limit ? parseInt(parsed.limit, 10) : 12;
        const skip = (page - 1) * limit;
        const categoryId = parsed.categoryId ? parseInt(parsed.categoryId, 10) : undefined;
        const q = (_a = parsed.q) === null || _a === void 0 ? void 0 : _a.trim();
        const where = {};
        if (categoryId)
            where.categoryId = categoryId;
        if (q)
            where.OR = [
                { name: { contains: q } },
                { description: { contains: q } },
            ];
        const [items, total] = await Promise.all([
            db_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: "desc" },
            }),
            db_1.prisma.product.count({ where }),
        ]);
        return { items, page, limit, total };
    });
    app.get("/:id", async (req) => {
        const id = parseInt(req.params.id, 10);
        const product = await db_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            req.raw.statusCode = 404;
            return { message: "Product not found" };
        }
        return product;
    });
};
exports.productsRoutes = productsRoutes;
