import express from "express";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.post("/signin", authController.signin);

router.post("/login", authController.login);

export default router;
