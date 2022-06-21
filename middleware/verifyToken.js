function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const token = bearerHeader.split(" ")[1];
    if (token != "undefined" && token !== "null") {
      req.token = token;
      next();
    }
  } else {
    res.sendStatus(403);
  }
}

module.exports = verifyToken;
