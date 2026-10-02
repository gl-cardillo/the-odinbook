import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkId } from "../middleware/errors.js";
import * as comments from "../controllers/commentController.js";

const router = express.Router();

router.use(verifyToken);

router.delete("/:commentId", checkId, comments.deleteComment);
router.put("/:commentId/like", checkId, comments.likeComment);
router.delete("/:commentId/like", checkId, comments.unlikeComment);
router.get("/:commentId/replies", checkId, comments.getReplies);
router.post("/:commentId/replies", checkId, comments.createReply);
router.delete("/:commentId/replies/:date", checkId, comments.deleteReply);

export default router;
