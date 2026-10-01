import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import * as commentController from "../controllers/commentController.js";

const router = express.Router();

// every route below needs a logged in user
router.use(verifyToken);

router.get("/:postId", commentController.getCommentsByPostId);

router.get("/getReply/:commentId", commentController.getReplyByCommentsId);

router.get("/getLikes/:commentId", commentController.getWhoLiked);

router.post("/createComment", commentController.createComment);

router.post("/createReply", commentController.createReply);

router.put("/addLike", commentController.addLike);

router.delete("/deleteComment", commentController.deleteComment);

router.delete("/deleteReply", commentController.deleteReply);

export default router;
