import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import * as postController from "../controllers/postController.js";

const router = express.Router();

router.get("/", postController.getPosts);

router.get("/byPostId/:postId", postController.getPostById)

router.get("/byUserId/:userId", postController.getPostsByUserId);

router.get("/getFriendsPost/:userId", postController.getFriendsPost);

router.get("/getAuthor/:userId", postController.getAuthor)

router.post("/createPost", verifyToken, postController.createPost);

router.get("/getLikes/:postId", postController.getWhoLiked);

router.put("/addLike", verifyToken, postController.addLike);

router.delete("/deletePost", verifyToken, postController.deletePost);

export default router;
