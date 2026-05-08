# 商城系统

## 🛠 技术栈
- Frontend: Vue3 + Vite + TypeScript + Tailwind CSS + Naive UI
- Backend: Node.js (Fastify) + Prisma ORM
- Database: SQLite (持久化通过 Docker Volume)

## 🚀 How to Run
1. 确保本机已安装并启动 Docker Desktop。
2. 在项目根目录执行：
   
   docker compose up --build
   
3. 前后端容器构建并启动后，即可访问服务。

## 🔗 Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

## ✅ Verification
- 打开 Frontend 服务地址 http://localhost:3000，查看首页商品列表与分类。
- 点击商品查看详情，执行“加入购物车”。
- 打开购物车，进入结算页，填写姓名/邮箱/地址并提交，确认订单创建成功并得到订单编号。
- 如需查看后端连通性，可直接访问 http://localhost:8000/api/products 获取 JSON 响应。

