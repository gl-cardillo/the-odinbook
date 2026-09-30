import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { accessTokenSecret } from "../config/env.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: string | jwt.JwtPayload;
  }
}

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader === "undefined") {
    res.sendStatus(403);
    return;
  }
  const token = bearerHeader.split(" ")[1];
  try {
    // throws if the token is missing, malformed or signed with another secret
    req.user = jwt.verify(token, accessTokenSecret());
  } catch {
    res.sendStatus(403);
    return;
  }
  next();
}

export default verifyToken;
