import rateLimit from "express-rate-limit";
import type { Request } from "express";

const limitFromEnv = (name: string, fallback: number) =>
  Number(process.env[name]) || fallback;

// counted per logged in user, behind verifyToken
const perUser = (req: Request) => req.userId ?? "anonymous";

const tooMany = (what: string) => ({
  message: `Too many ${what}, please try again later`,
});

// slows down password guessing on login and signup, counted per ip
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: limitFromEnv("AUTH_RATE_LIMIT", 20),
  standardHeaders: true,
  message: tooMany("login attempts"),
});

// posts, comments, likes, friend requests... reading is not limited
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: limitFromEnv("WRITE_RATE_LIMIT", 30),
  standardHeaders: true,
  keyGenerator: perUser,
  skip: (req) => req.method === "GET",
  message: tooMany("actions"),
});

// every upload costs storage, so the stricter limit
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: limitFromEnv("UPLOAD_RATE_LIMIT", 20),
  standardHeaders: true,
  keyGenerator: perUser,
  message: tooMany("uploads"),
});
