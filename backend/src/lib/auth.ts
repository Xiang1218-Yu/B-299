import bcrypt from "bcrypt";
import { prisma } from "./db";

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-must-be-changed-in-production";

// 密码加密轮数
const SALT_ROUNDS = 10;

/**
 * JWT 负载类型
 */
export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
}

/**
 * 哈希密码
 * @param password 明文密码
 * @returns 加密后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 加密后的密码
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 根据 JWT 负载获取用户
 * @param payload JWT 负载
 * @returns 用户信息或 null
 */
export async function getUserFromPayload(payload: JwtPayload) {
  if (!payload || !payload.userId) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true },
  });
}

export { JWT_SECRET };
