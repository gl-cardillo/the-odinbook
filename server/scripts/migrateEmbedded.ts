import mongoose from "mongoose";
type Db = mongoose.mongo.Db;
import type { NotificationType } from "../models/notification.js";

interface LegacyNotification {
  userId?: unknown;
  message?: string;
  date?: number | string | Date;
  seen?: boolean;
  link?: string;
  elementId?: string;
  commentId?: string;
}

interface LegacyReply {
  authorId?: unknown;
  text?: string;
  date?: number | string | Date;
}

const TYPES_BY_MESSAGE: Record<string, NotificationType> = {
  "sent you a friend request": "friend_request",
  "accepted your friend request": "friend_accept",
  "accepted your friend requests": "friend_accept",
  "liked your post": "post_like",
  "commented your post": "post_comment",
  "liked your comment": "comment_like",
  "reply to your comment": "comment_reply",
  "replied to your comment": "comment_reply",
};

const postIdFromLink = (link?: string) =>
  link?.match(/^\/singlePost\/([0-9a-f]{24})/)?.[1];

// a legacy notification in the new shape, undefined if it can't be read
export const convertNotification = (
  recipientId: string,
  old: LegacyNotification
) => {
  const message = (old.message ?? "").trim().replace(/\s+/g, " ");
  const type = TYPES_BY_MESSAGE[message];
  if (!type || !old.userId) return undefined;

  const postId = postIdFromLink(old.link);
  const doc: Record<string, unknown> = {
    recipientId,
    actorId: String(old.userId),
    type,
    seen: Boolean(old.seen),
    createdAt: old.date ? new Date(old.date) : new Date(0),
  };
  if (type === "post_like" || type === "post_comment") {
    doc.postId = postId ?? old.elementId;
  }
  if (type === "comment_like") {
    doc.postId = postId ?? old.elementId;
    if (old.commentId) doc.commentId = old.commentId;
  }
  if (type === "comment_reply") {
    // the old code kept the comment id in elementId for replies
    doc.postId = postId;
    doc.commentId = old.commentId ?? old.elementId;
  }
  if (old.commentId && type === "post_comment") doc.commentId = old.commentId;
  return doc;
};

const toStrings = (ids: unknown[] = []) => ids.map((id) => String(id));
const hasNonString = (ids: unknown[] = []) =>
  ids.some((id) => typeof id !== "string");

export interface MigrationReport {
  usersWithNotifications: number;
  notificationsMoved: number;
  notificationsSkipped: number;
  commentsWithReplies: number;
  repliesMoved: number;
  repliesSkipped: number;
  documentsWithObjectIds: number;
}

export const migrate = async (db: Db, apply: boolean) => {
  const report: MigrationReport = {
    usersWithNotifications: 0,
    notificationsMoved: 0,
    notificationsSkipped: 0,
    commentsWithReplies: 0,
    repliesMoved: 0,
    repliesSkipped: 0,
    documentsWithObjectIds: 0,
  };
  const users = db.collection("users");
  const comments = db.collection("comments");
  const posts = db.collection("posts");

  // notifications
  for await (const user of users.find({ notifications: { $exists: true } })) {
    report.usersWithNotifications++;
    for (const old of (user.notifications ?? []) as LegacyNotification[]) {
      const doc = convertNotification(String(user._id), old);
      if (!doc) {
        report.notificationsSkipped++;
        continue;
      }
      report.notificationsMoved++;
      if (apply) {
        await db
          .collection("notifications")
          .updateOne(doc, { $setOnInsert: doc }, { upsert: true });
      }
    }
    if (apply) {
      await users.updateOne(
        { _id: user._id },
        { $unset: { notifications: "" } }
      );
    }
  }

  // replies
  for await (const comment of comments.find({ reply: { $exists: true } })) {
    report.commentsWithReplies++;
    for (const old of (comment.reply ?? []) as LegacyReply[]) {
      if (!old.authorId || !old.text) {
        report.repliesSkipped++;
        continue;
      }
      report.repliesMoved++;
      const doc = {
        commentId: String(comment._id),
        postId: String(comment.postId),
        authorId: String(old.authorId),
        text: old.text,
        date: old.date ? new Date(old.date) : new Date(0),
      };
      if (apply) {
        await db
          .collection("replies")
          .updateOne(doc, { $setOnInsert: doc }, { upsert: true });
      }
    }
    if (apply) {
      await comments.updateOne({ _id: comment._id }, { $unset: { reply: "" } });
    }
  }

  // ids saved as ObjectId instead of strings
  for (const [collection, fields] of [
    [users, ["friends", "friendRequests"]],
    [posts, ["likes"]],
    [comments, ["likes"]],
  ] as const) {
    for await (const doc of collection.find({})) {
      const fixes: Record<string, string[]> = {};
      for (const field of fields) {
        if (hasNonString(doc[field])) fixes[field] = toStrings(doc[field]);
      }
      if (Object.keys(fixes).length === 0) continue;
      report.documentsWithObjectIds++;
      if (apply) await collection.updateOne({ _id: doc._id }, { $set: fixes });
    }
  }

  return report;
};

// run from the command line
if (process.argv[1]?.endsWith("migrateEmbedded.ts")) {
  await import("../config/env.js");
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  const report = await migrate(mongoose.connection.db as Db, apply);
  console.log(apply ? "Applied:" : "Dry run, nothing changed:");
  console.table(report);
  if (apply) {
    // create the indexes of the new collections
    await import("../models/notification.js").then((m) =>
      m.default.syncIndexes()
    );
    await import("../models/reply.js").then((m) => m.default.syncIndexes());
  } else {
    console.log("Run again with --apply to make these changes.");
  }
  await mongoose.disconnect();
}
