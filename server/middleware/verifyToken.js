const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const token = bearerHeader.split(" ")[1];
    if (token != "undefined" && token !== "null") {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log(decoded)
      if (!decoded) {
        return res.sendStatus(403);
      }
      req.user = decoded;
      next();
    }
  } else {
    res.sendStatus(403);
  }
}

module.exports = verifyToken;
