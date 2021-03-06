const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const logger = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();
require("./config/mongoDB");
require("./config/passport");

const usersRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comment");

const app = express();

app.use(cors());

app.use(compression());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "./client/build")));

app.use("/auth", authRouter);
app.use("/user", usersRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

module.exports = app;
