import Comment from "../models/comment.js";
import User from "../models/user.js";
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

const textRule = () =>
  body("text", "Text is required").trim().isLength({ min: 1 });

const findComment = async (id: string, fields?: string) => {
  const comment = await Comment.findById(id, fields);
  if (!comment) throw notFound("Comment");
  return comment;
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
    await notify(post.authorId, me, {
      message: "commented your post",
      elementId: post.id,
      commentId: comment.id,
      link: `/singlePost/${post.id}`,
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

  // notifications about the comment, its likes and its replies
  await User.updateMany(
    {
      $or: [
        { "notifications.commentId": comment.id },
        { "notifications.elementId": comment.id },
      ],
    },
    {
      $pull: {
        notifications: {
          $or: [{ commentId: comment.id }, { elementId: comment.id }],
        },
      },
    }
  );

  res.sendStatus(204);
};

// GET /comments/:commentId/replies
export const getReplies = async (req: Request, res: Response) => {
  const comment = await findComment(String(req.params.commentId), "reply");
  const users = await findUserSummaries(
    comment.reply.map((reply) => reply.authorId)
  );
  const replies = comment.reply.flatMap((reply) => {
    const user = users.get(String(reply.authorId));
    // skip replies whose author deleted the account
    if (!user) return [];
    return [
      {
        authorId: reply.authorId,
        text: reply.text,
        profilePicUrl: user.profilePicUrl,
        authorFullname: user.fullname,
        date: reply.date,
      },
    ];
  });
  res.json(replies);
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
    const date = Date.now();

    await Comment.updateOne(
      { _id: comment.id },
      { $push: { reply: { text: req.body.text, authorId: me, date } } }
    );
    await notify(comment.authorId, me, {
      message: "replied to your comment",
      elementId: comment.id,
      date,
      link: `/singlePost/${comment.postId}`,
    });

    res.sendStatus(201);
  },
];

// DELETE /comments/:commentId/replies/:date, replies are identified by
// their author and date, and only your own can be deleted
export const deleteReply = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const date = Number(req.params.date);
  const comment = await findComment(String(req.params.commentId), "authorId");

  const result = await Comment.updateOne(
    { _id: comment.id, reply: { $elemMatch: { authorId: me, date } } },
    { $pull: { reply: { authorId: me, date } } }
  );
  if (result.matchedCount === 0) throw notFound("Reply");

  await removeNotifications(comment.authorId, {
    elementId: comment.id,
    userId: me,
    date,
  });
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
    await notify(comment.authorId, me, {
      message: "liked your comment",
      elementId: comment.postId,
      commentId: comment.id,
      link: `/singlePost/${comment.postId}`,
    });
  }

  const updated = await findComment(comment.id, "likes");
  res.json(await userSummaries(updated.likes));
};

// DELETE /comments/:commentId/like
export const unlikeComment = async (req: Request, res: Response) => {
  const comment = await Comment.findByIdAndUpdate(
    String(req.params.commentId),
    { $pull: { likes: currentUserId(req) } },
    { new: true, projection: "likes" }
  );
  if (!comment) throw notFound("Comment");
  res.json(await userSummaries(comment.likes));
};
