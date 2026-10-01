import "./config/env.js";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import usersRouter from "./routes/user.js";
import authRouter from "./routes/auth.js";
import postRouter from "./routes/post.js";
import commentRouter from "./routes/comment.js";

const app = express();

// behind the vercel proxy, needed for the rate limit to see the real ip
app.set("trust proxy", 1);

// CLIENT_URL limits the api to the deployed client, all origins otherwise
// (browsers send the origin without a trailing slash)
const clientUrl = process.env.CLIENT_URL?.replace(/\/+$/, "");
app.use(cors(clientUrl ? { origin: clientUrl } : {}));
app.use(helmet());
app.use(compression());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// slow down password guessing on login and signup
app.use(
  "/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true }),
  authRouter
);
app.use("/user", usersRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

app.get("/", (_req, res) => {
  res.send("Welcome to the API");
});

export default app;
