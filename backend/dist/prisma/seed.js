"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const count = await prisma.product.count();
    if (count > 0)
        return;
    const categories = await prisma.$transaction([
        prisma.category.create({ data: { name: "电子产品", slug: "electronics" } }),
        prisma.category.create({ data: { name: "服饰鞋帽", slug: "fashion" } }),
        prisma.category.create({ data: { name: "家居生活", slug: "home" } }),
    ]);
    const [electronics, fashion, home] = categories;
    await prisma.$transaction([
        prisma.product.create({
            data: {
                name: "无线蓝牙耳机",
                description: "降噪设计，持久续航，音质出众",
                priceCents: 39900,
                imageUrl: "https://picsum.photos/id/1011/800/600",
                stock: 50,
                categoryId: electronics.id,
            },
        }),
        prisma.product.create({
            data: {
                name: "智能手表",
                description: "健康监测，消息提醒，运动记录",
                priceCents: 69900,
                imageUrl: "https://picsum.photos/id/1021/800/600",
                stock: 30,
                categoryId: electronics.id,
            },
        }),
        prisma.product.create({
            data: {
                name: "纯棉T恤",
                description: "舒适透气，多色可选",
                priceCents: 12900,
                imageUrl: "https://picsum.photos/id/1031/800/600",
                stock: 100,
                categoryId: fashion.id,
            },
        }),
        prisma.product.create({
            data: {
                name: "休闲运动鞋",
                description: "轻便耐磨，行走无压力",
                priceCents: 25900,
                imageUrl: "https://picsum.photos/id/1041/800/600",
                stock: 60,
                categoryId: fashion.id,
            },
        }),
        prisma.product.create({
            data: {
                name: "北欧风抱枕",
                description: "柔软亲肤，点缀客厅美学",
                priceCents: 9900,
                imageUrl: "https://picsum.photos/id/1051/800/600",
                stock: 80,
                categoryId: home.id,
            },
        }),
        prisma.product.create({
            data: {
                name: "香氛蜡烛",
                description: "营造温馨氛围，净化空气",
                priceCents: 14900,
                imageUrl: "https://picsum.photos/id/1061/800/600",
                stock: 70,
                categoryId: home.id,
            },
        }),
    ]);
}
run()
    .catch(() => { })
    .finally(async () => {
    await prisma.$disconnect();
});
