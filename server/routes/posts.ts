import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkId } from "../middleware/errors.js";
import * as posts from "../controllers/postController.js";
import * as comments from "../controllers/commentController.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", posts.getPosts);
router.get("/feed", posts.getFeed);
router.post("/", posts.createPost);
router.get("/:postId", checkId, posts.getPost);
router.delete("/:postId", checkId, posts.deletePost);
router.get("/:postId/likes", checkId, posts.getLikes);
router.put("/:postId/like", checkId, posts.likePost);
router.delete("/:postId/like", checkId, posts.unlikePost);
router.get("/:postId/comments", checkId, comments.getComments);
router.post("/:postId/comments", checkId, comments.createComment);

export default router;
