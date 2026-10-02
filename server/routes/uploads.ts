import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import * as uploads from "../controllers/uploadController.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", uploads.createUpload);

export default router;
