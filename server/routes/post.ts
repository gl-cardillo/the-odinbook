import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import * as postController from "../controllers/postController.js";

const router = express.Router();

// every route below needs a logged in user
router.use(verifyToken);

router.get("/", postController.getPosts);

router.get("/byPostId/:postId", postController.getPostById)

router.get("/byUserId/:userId", postController.getPostsByUserId);

router.get("/getFriendsPost/:userId", postController.getFriendsPost);

router.get("/getAuthor/:userId", postController.getAuthor)

router.post("/createPost", postController.createPost);

router.get("/getLikes/:postId", postController.getWhoLiked);

router.put("/addLike", postController.addLike);

router.delete("/deletePost", postController.deletePost);

export default router;
