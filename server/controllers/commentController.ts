import Comment from "../models/comment.js";
import Reply from "../models/reply.js";
import { body } from "express-validator";
import type { Request, Response } from "express";
import { currentUserId } from "../middleware/verifyToken.js";
import { forbidden, notFound, validate } from "../middleware/errors.js";
import { notify, removeNotifications } from "./notify.js";
import { findPost } from "./postController.js";
import {
  findUserSummaries,
  userSummaries,
  withCommentDetails,
} from "./details.js";

export const MAX_COMMENT_LENGTH = 2000;

// comments and replies
const textRule = () =>
  body("text")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Text is required")
    .isLength({ max: MAX_COMMENT_LENGTH })
    .withMessage(`Comments can be at most ${MAX_COMMENT_LENGTH} characters`);

const findComment = async (id: string, fields?: string) => {
  const comment = await Comment.findById(id, fields);
  if (!comment) throw notFound("Comment");
  return comment;
};

type ReplyDoc = InstanceType<typeof Reply>;

// replies with their author, null when the account was deleted
const withAuthors = async (replies: ReplyDoc[]) => {
  const users = await findUserSummaries(replies.map((reply) => reply.authorId));
  return replies.map((reply) => ({
    ...reply.toJSON(),
    author: users.get(reply.authorId) ?? null,
  }));
};

// GET /posts/:postId/comments, oldest first
export const getComments = async (req: Request, res: Response) => {
  const comments = await Comment.find({
    postId: String(req.params.postId),
  }).sort({ date: 1 });
  res.json(await withCommentDetails(comments));
};

// POST /posts/:postId/comments
export const createComment = [
  ...validate(textRule()),
  async (req: Request, res: Response) => {
    const me = currentUserId(req);
    const post = await findPost(String(req.params.postId), "authorId");

    const comment = await Comment.create({
      text: req.body.text,
      postId: post.id,
      authorId: me,
    });
    await notify(post.authorId, me, "post_comment", {
      postId: post.id,
      commentId: comment.id,
    });

    const [detailed] = await withCommentDetails([comment]);
    res.status(201).json(detailed);
  },
];

export const deleteComment = async (req: Request, res: Response) => {
  const comment = await findComment(String(req.params.commentId));
  if (comment.authorId !== currentUserId(req)) {
    throw forbidden("You can only delete your own comments");
  }
  await comment.deleteOne();

  // its replies and every notification about it, its likes and its replies
  await Reply.deleteMany({ commentId: comment.id });
  await removeNotifications({ commentId: comment.id });

  res.sendStatus(204);
};

// GET /comments/:commentId/replies, oldest first
export const getReplies = async (req: Request, res: Response) => {
  const replies = await Reply.find({
    commentId: String(req.params.commentId),
  }).sort({ date: 1 });
  res.json(await withAuthors(replies));
};

// POST /comments/:commentId/replies
export const createReply = [
  ...validate(textRule()),
  async (req: Request, res: Response) => {
    const me = currentUserId(req);
    const comment = await findComment(
      String(req.params.commentId),
      "authorId postId"
    );

    const reply = await Reply.create({
      commentId: comment.id,
      postId: comment.postId,
      authorId: me,
      text: req.body.text,
    });
    await notify(comment.authorId, me, "comment_reply", {
      postId: comment.postId,
      commentId: comment.id,
      replyId: reply.id,
    });

    const [detailed] = await withAuthors([reply]);
    res.status(201).json(detailed);
  },
];

// DELETE /comments/:commentId/replies/:replyId, only your own
export const deleteReply = async (req: Request, res: Response) => {
  const reply = await Reply.findOne({
    _id: String(req.params.replyId),
    commentId: String(req.params.commentId),
  });
  if (!reply) throw notFound("Reply");
  if (reply.authorId !== currentUserId(req)) {
    throw forbidden("You can only delete your own replies");
  }
  await reply.deleteOne();
  await removeNotifications({ replyId: reply.id });
  res.sendStatus(204);
};

// PUT /comments/:commentId/like, answers with the new list of likes
export const likeComment = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const comment = await findComment(
    String(req.params.commentId),
    "authorId postId likes"
  );

  if (!comment.likes.includes(me)) {
    await Comment.updateOne({ _id: comment.id }, { $addToSet: { likes: me } });
    await notify(comment.authorId, me, "comment_like", {
      postId: comment.postId,
      commentId: comment.id,
    });
  }

  const updated = await findComment(comment.id, "likes");
  res.json(await userSummaries(updated.likes));
};

// DELETE /comments/:commentId/like
export const unlikeComment = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const comment = await Comment.findByIdAndUpdate(
    String(req.params.commentId),
    { $pull: { likes: me } },
    { new: true, projection: "likes" }
  );
  if (!comment) throw notFound("Comment");
  await removeNotifications({
    actorId: me,
    type: "comment_like",
    commentId: comment.id,
  });
  res.json(await userSummaries(comment.likes));
};
