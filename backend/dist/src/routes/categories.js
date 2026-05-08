"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRoutes = void 0;
const db_1 = require("../lib/db");
const categoriesRoutes = async (app) => {
    app.get("/", async () => {
        const cats = await db_1.prisma.category.findMany({ orderBy: { id: "asc" } });
        return cats;
    });
};
exports.categoriesRoutes = categoriesRoutes;
