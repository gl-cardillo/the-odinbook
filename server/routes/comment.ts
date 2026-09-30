import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import * as commentController from "../controllers/commentController.js";

const router = express.Router();

router.get("/:postId", commentController.getCommentsByPostId);

router.get("/getReply/:commentId", commentController.getReplyByCommentsId);

router.get("/getLikes/:commentId", commentController.getWhoLiked);

router.post("/createComment", verifyToken, commentController.createComment);

router.post("/createReply", verifyToken, commentController.createReply);

router.put("/addLike", verifyToken, commentController.addLike);

router.delete("/deleteComment", verifyToken, commentController.deleteComment);

router.delete("/deleteReply", verifyToken, commentController.deleteReply);

export default router;
