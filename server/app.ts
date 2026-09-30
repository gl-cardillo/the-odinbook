import "./config/env.js";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";

import usersRouter from "./routes/user.js";
import authRouter from "./routes/auth.js";
import postRouter from "./routes/post.js";
import commentRouter from "./routes/comment.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", usersRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

app.get("/", (_req, res) => {
  res.send("Welcome to the API");
});

export default app;
