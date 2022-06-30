const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const commentController = require("../controllers/commentController");

router.get("/:postId", commentController.getCommentsByPostId);

router.get("/getReply/:commentId", commentController.getReplyByCommentsId);

router.get("/getLikes/:commentId", commentController.getWhoLiked);

router.post("/createComment", verifyToken, commentController.createComment);

router.post("/createReply", verifyToken, commentController.createReply);

router.put("/addLike", verifyToken, commentController.addLike);

router.delete("/deleteComment", verifyToken, commentController.deleteComment);

router.delete("/deleteReply", verifyToken, commentController.deleteReply);

module.exports = router;
