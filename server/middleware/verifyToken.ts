import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { accessTokenSecret } from "../config/env.js";

declare module "express-serve-static-core" {
  interface Request {
    // id of the logged in user, set by verifyToken
    userId?: string;
  }
}

export const signToken = (userId: string) =>
  jwt.sign({}, accessTokenSecret(), { subject: userId, expiresIn: "7d" });

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Login required" });
    return;
  }
  try {
    // throws if the token is malformed, expired or signed with another secret
    const payload = jwt.verify(token, accessTokenSecret());
    if (typeof payload === "string" || !payload.sub) {
      throw new Error("Token without user");
    }
    req.userId = payload.sub;
  } catch {
    res.status(401).json({ message: "Session expired, please log in again" });
    return;
  }
  next();
}

// the logged in user, only valid on routes behind verifyToken
export const currentUserId = (req: Request) => req.userId as string;

export default verifyToken;
