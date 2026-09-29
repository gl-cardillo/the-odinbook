const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader === "undefined") {
    return res.sendStatus(403);
  }
  const token = bearerHeader.split(" ")[1];
  try {
    // throws if the token is missing, malformed or signed with another secret
    req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return res.sendStatus(403);
  }
  next();
}

module.exports = verifyToken;
