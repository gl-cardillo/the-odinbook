import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import * as uploads from "../controllers/uploadController.js";
import { uploadLimiter, writeLimiter } from "../middleware/rateLimits.js";

const router = express.Router();

router.use(verifyToken, writeLimiter, uploadLimiter);

router.post("/", uploads.createUpload);

export default router;
