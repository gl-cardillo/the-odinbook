const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const commentController = require("../controllers/commentController");

router.get("/:postId", commentController.getCommentsByPostId);

router.get("/getLikes/:commentId", commentController.getWhoLiked);

router.post("/createComment", verifyToken, commentController.createComment);

router.put("/addLike", verifyToken, commentController.addLike);

router.delete("/deleteComment", verifyToken, commentController.deleteComment);

module.exports = router;
