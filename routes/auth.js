const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

router.post("/signin", authController.signin);

router.post("/login", authController.login);

module.exports = router;
