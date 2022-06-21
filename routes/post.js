const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const postController = require("../controllers/postController");

router.get("/", postController.getPosts);

router.get("/byPostId/:postId", postController.getPostById)

router.get("/byUserId/:userId", postController.getPostsByUserId);

router.get("/getFriendsPost/:userId", postController.getFriendsPost);

router.post("/createPost", verifyToken, postController.createPost);

router.get("/getLikes/:postId", postController.getWhoLiked);

router.put("/addLike", verifyToken, postController.addLike);

router.delete("/deletePost", verifyToken, postController.deletePost);

module.exports = router;
