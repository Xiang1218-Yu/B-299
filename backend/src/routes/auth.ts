import { FastifyPluginAsync, FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "../lib/db";
import { z } from "zod";
import { hashPassword, verifyPassword, JwtPayload } from "../lib/auth";

// 注册请求校验
const registerSchema = z.object({
  name: z.string().min(1, "用户名不能为空"),
  email: z.string().email("邮箱格式错误"),
  password: z.string().min(6, "密码至少6位"),
});

// 登录请求校验
const loginSchema = z.object({
  email: z.string().email("邮箱格式错误"),
  password: z.string().min(1, "密码不能为空"),
});

type RegisterBody = {
  name: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * 用户注册
   */
  app.post("/register", async (req: FastifyRequest<{ Body: RegisterBody }>, reply) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({
        message: body.error.issues[0]?.message || "参数校验失败",
      });
    }

    const { name, email, password } = body.data;

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return reply.code(400).send({ message: "该邮箱已被注册" });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 生成 JWT token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    const token = app.jwt.sign(payload, { expiresIn: "7d" });

    return reply.code(201).send({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });

  /**
   * 用户登录
   */
  app.post("/login", async (req: FastifyRequest<{ Body: LoginBody }>, reply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({
        message: body.error.issues[0]?.message || "参数校验失败",
      });
    }

    const { email, password } = body.data;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return reply.code(401).send({ message: "邮箱或密码错误" });
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return reply.code(401).send({ message: "邮箱或密码错误" });
    }

    // 生成 JWT token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    const token = app.jwt.sign(payload, { expiresIn: "7d" });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  });

  /**
   * 获取当前用户信息（需要登录）
   */
  app.get("/me", { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: (req.user as JwtPayload).userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) {
      return reply.code(404).send({ message: "用户不存在" });
    }
    return user;
  });
};
