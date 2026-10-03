import "./config/env.js";
import express from "express";
import logger from "morgan";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import postsRouter from "./routes/posts.js";
import commentsRouter from "./routes/comments.js";
import uploadsRouter from "./routes/uploads.js";
import { errorHandler, routeNotFound } from "./middleware/errors.js";
import { authLimiter } from "./middleware/rateLimits.js";

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

app.use("/auth", authLimiter, authRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/uploads", uploadsRouter);

app.get("/", (_req, res) => {
  res.send("Welcome to the API");
});

app.use(routeNotFound);
app.use(errorHandler);

export default app;
