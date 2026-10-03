import Post from "../models/post.js";
import Comment from "../models/comment.js";
import { body } from "express-validator";
import { deleteFile } from "../config/s3.js";
import type { Request, Response } from "express";
import { currentUserId } from "../middleware/verifyToken.js";
import { forbidden, notFound, validate } from "../middleware/errors.js";
import { notify, removeNotifications } from "./notify.js";
import Reply from "../models/reply.js";
import { findUser } from "./userController.js";
import { pageQuery, userSummaries, withPostDetails } from "./details.js";
import { claimUpload, forgetUpload } from "./uploadController.js";

export const MAX_POST_LENGTH = 5000;

export const findPost = async (id: string, fields?: string) => {
  const post = await Post.findById(id, fields);
  if (!post) throw notFound("Post");
  return post;
};

// GET /posts, every post
export const getPosts = async (req: Request, res: Response) => {
  const posts = await pageQuery(Post, {}, req.query);
  res.json(await withPostDetails(posts));
};

// GET /posts/feed, posts of the logged in user and their friends
export const getFeed = async (req: Request, res: Response) => {
  const me = await findUser(currentUserId(req), "friends");
  const posts = await pageQuery(
    Post,
    { authorId: { $in: [...me.friends, me.id] } },
    req.query
  );
  res.json(await withPostDetails(posts));
};

// GET /users/:userId/posts
export const getUserPosts = async (req: Request, res: Response) => {
  const posts = await pageQuery(
    Post,
    { authorId: String(req.params.userId) },
    req.query
  );
  res.json(await withPostDetails(posts));
};

export const getPost = async (req: Request, res: Response) => {
  const post = await findPost(String(req.params.postId));
  const [detailed] = await withPostDetails([post]);
  res.json(detailed);
};

export const createPost = [
  ...validate(
    body("text", "Text is required").trim().isLength({ min: 1 }),
    body("text", `Posts can be at most ${MAX_POST_LENGTH} characters`).isLength(
      {
        max: MAX_POST_LENGTH,
      }
    )
  ),
  async (req: Request, res: Response) => {
    const { text, picUrl } = req.body;
    const authorId = currentUserId(req);
    const post = await Post.create({
      text,
      picUrl: picUrl ? await claimUpload(authorId, picUrl) : undefined,
      authorId,
    });
    const [detailed] = await withPostDetails([post]);
    res.status(201).json(detailed);
  },
];

export const deletePost = async (req: Request, res: Response) => {
  const post = await findPost(String(req.params.postId));
  if (post.authorId !== currentUserId(req)) {
    throw forbidden("You can only delete your own posts");
  }

  await post.deleteOne();
  deleteFile(post.picUrl);
  await forgetUpload(post.picUrl);

  // everything under the post and the notifications about it
  await Comment.deleteMany({ postId: post.id });
  await Reply.deleteMany({ postId: post.id });
  await removeNotifications({ postId: post.id });

  res.sendStatus(204);
};

export const getLikes = async (req: Request, res: Response) => {
  const post = await findPost(String(req.params.postId), "likes");
  res.json(await userSummaries(post.likes));
};

// PUT /posts/:postId/like, answers with the new list of likes
export const likePost = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const post = await findPost(String(req.params.postId), "authorId likes");

  if (!post.likes.includes(me)) {
    await Post.updateOne({ _id: post.id }, { $addToSet: { likes: me } });
    await notify(post.authorId, me, "post_like", { postId: post.id });
  }

  const updated = await findPost(post.id, "likes");
  res.json(await userSummaries(updated.likes));
};

// DELETE /posts/:postId/like
export const unlikePost = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const post = await Post.findByIdAndUpdate(
    String(req.params.postId),
    { $pull: { likes: me } },
    { new: true, projection: "likes" }
  );
  if (!post) throw notFound("Post");
  await removeNotifications({
    actorId: me,
    type: "post_like",
    postId: post.id,
  });
  res.json(await userSummaries(post.likes));
};
