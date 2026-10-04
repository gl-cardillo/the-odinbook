import mongoose from "mongoose";
import User from "../models/user.js";
import Comment from "../models/comment.js";
import Reply from "../models/reply.js";
import type Post from "../models/post.js";
import type CommentModel from "../models/comment.js";
import { PAGE_SIZE } from "@odinbook/shared";
import type {
  Comment as CommentResponse,
  Post as PostResponse,
  UserSummary,
} from "@odinbook/shared";

type PostDoc = InstanceType<typeof Post>;
type CommentDoc = InstanceType<typeof CommentModel>;

// one query for any number of users, instead of one findById each
export const findUserSummaries = async (ids: unknown[]) => {
  const unique = [...new Set(ids.map(String))].filter((id) =>
    mongoose.isValidObjectId(id)
  );
  const users = await User.find(
    { _id: { $in: unique } },
    "firstname lastname profilePicUrl"
  );
  return new Map<string, UserSummary>(
    users.map((user) => [
      user.id,
      {
        id: user.id,
        fullname: user.fullname,
        profilePicUrl: user.profilePicUrl ?? undefined,
      },
    ])
  );
};

// keeps the order of the ids and skips users that deleted their account
export const pickUsers = (ids: unknown[], users: Map<string, UserSummary>) =>
  ids
    .map((id) => users.get(String(id)))
    .filter((user): user is UserSummary => Boolean(user));

export const userSummaries = async (ids: unknown[]) =>
  pickUsers(ids, await findUserSummaries(ids));

// posts with author, who liked them and how many comments they have
export const withPostDetails = async (
  posts: PostDoc[]
): Promise<PostResponse[]> => {
  if (posts.length === 0) return [];
  const users = await findUserSummaries(
    posts.flatMap((post) => [post.authorId, ...post.likes])
  );
  const counts = await Comment.aggregate<{ _id: string; count: number }>([
    { $match: { postId: { $in: posts.map((post) => post.id) } } },
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]);
  const commentsCount = new Map(counts.map((c) => [c._id, c.count]));

  return posts.map((post) => ({
    ...(post.toJSON() as unknown as Omit<
      PostResponse,
      "author" | "likedBy" | "commentsCount"
    >),
    author: users.get(post.authorId) ?? null,
    likedBy: pickUsers(post.likes, users),
    commentsCount: commentsCount.get(post.id) ?? 0,
  }));
};

// comments with author, who liked them and how many replies they have
export const withCommentDetails = async (
  comments: CommentDoc[]
): Promise<CommentResponse[]> => {
  if (comments.length === 0) return [];
  const users = await findUserSummaries(
    comments.flatMap((comment) => [comment.authorId, ...comment.likes])
  );
  const counts = await Reply.aggregate<{ _id: string; count: number }>([
    { $match: { commentId: { $in: comments.map((comment) => comment.id) } } },
    { $group: { _id: "$commentId", count: { $sum: 1 } } },
  ]);
  const repliesCount = new Map(counts.map((c) => [c._id, c.count]));

  return comments.map((comment) => ({
    ...(comment.toJSON() as unknown as Omit<
      CommentResponse,
      "author" | "likedBy" | "repliesCount"
    >),
    author: users.get(comment.authorId) ?? null,
    likedBy: pickUsers(comment.likes, users),
    repliesCount: repliesCount.get(comment.id) ?? 0,
  }));
};

// cursor pagination: ?before=<id of the last post shown>&limit=10
export const pageQuery = async (
  model: typeof Post,
  filter: Record<string, unknown>,
  query: { before?: unknown; limit?: unknown }
) => {
  const limit = Math.min(Math.max(Number(query.limit) || PAGE_SIZE, 1), 50);
  const conditions: Record<string, unknown>[] = [filter];

  if (
    typeof query.before === "string" &&
    mongoose.isValidObjectId(query.before)
  ) {
    const last = await model.findById(query.before, "date");
    if (last) {
      // older than the last post, using the id to break ties on the same date
      conditions.push({
        $or: [
          { date: { $lt: last.date } },
          { date: last.date, _id: { $lt: last._id } },
        ],
      });
    }
  }

  return model
    .find({ $and: conditions })
    .sort({ date: -1, _id: -1 })
    .limit(limit);
};
