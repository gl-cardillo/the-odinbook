const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();
require("./config/mongoDB");
require("./config/passport");

const usersRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comment");

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

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.listen(3000, () => console.log("Server ready on port 3000."));


module.exports = app;
