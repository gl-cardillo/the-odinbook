import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import {
  initializeMongoServer,
  closeMongoServer,
} from "./mongoConfigTesting.js";
import { migrate } from "../scripts/migrateEmbedded.js";

const db = () => mongoose.connection.db as mongoose.mongo.Db;
const id = () => new mongoose.Types.ObjectId();

const alice = id();
const bob = id();
const post = id();
const comment = id();

beforeAll(async () => {
  await initializeMongoServer();

  // documents in the shapes the old code saved
  await db()
    .collection("users")
    .insertMany([
      {
        _id: alice,
        firstname: "Alice",
        lastname: "Smith",
        email: "alice@example.com",
        friends: [bob],
        friendRequests: [],
        notifications: [
          {
            userId: String(bob),
            message: "sent you a friend request",
            date: 1700000000000,
            seen: false,
            link: "/friendRequests",
          },
          {
            userId: String(bob),
            message: "liked your post",
            date: 1700000001000,
            seen: true,
            elementId: String(post),
            link: `/singlePost/${post}`,
          },
          {
            userId: String(bob),
            message: "reply to  your comment",
            date: 1700000002000,
            seen: false,
            elementId: String(comment),
            link: `/singlePost/${post}`,
          },
          { userId: String(bob), message: "something unknown" },
        ],
      },
      {
        _id: bob,
        firstname: "Bob",
        lastname: "Jones",
        email: "bob@example.com",
        friends: [String(alice)],
        friendRequests: [],
      },
    ]);
  await db()
    .collection("posts")
    .insertOne({
      _id: post,
      authorId: String(alice),
      text: "Hi",
      likes: [bob],
    });
  await db()
    .collection("comments")
    .insertOne({
      _id: comment,
      postId: String(post),
      authorId: String(alice),
      text: "Hello",
      likes: [],
      reply: [
        { authorId: String(bob), text: "Hey", date: 1700000002000 },
        { text: "no author" },
      ],
    });
});

describe("migrateEmbedded", () => {
  it("Should only report in a dry run", async () => {
    const report = await migrate(db(), false);
    expect(report).toEqual({
      usersWithNotifications: 1,
      notificationsMoved: 3,
      notificationsSkipped: 1,
      commentsWithReplies: 1,
      repliesMoved: 1,
      repliesSkipped: 1,
      documentsWithObjectIds: 2,
    });
    expect(await db().collection("notifications").countDocuments()).toEqual(0);
    const user = await db().collection("users").findOne({ _id: alice });
    expect(user?.notifications.length).toEqual(4);
  });

  it("Should move notifications and replies to their collections", async () => {
    await migrate(db(), true);

    const notifications = await db()
      .collection("notifications")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: 1 })
      .toArray();
    expect(notifications).toEqual([
      {
        recipientId: String(alice),
        actorId: String(bob),
        type: "friend_request",
        seen: false,
        createdAt: new Date(1700000000000),
      },
      {
        recipientId: String(alice),
        actorId: String(bob),
        type: "post_like",
        postId: String(post),
        seen: true,
        createdAt: new Date(1700000001000),
      },
      {
        recipientId: String(alice),
        actorId: String(bob),
        type: "comment_reply",
        postId: String(post),
        commentId: String(comment),
        seen: false,
        createdAt: new Date(1700000002000),
      },
    ]);

    const replies = await db()
      .collection("replies")
      .find({}, { projection: { _id: 0 } })
      .toArray();
    expect(replies).toEqual([
      {
        commentId: String(comment),
        postId: String(post),
        authorId: String(bob),
        text: "Hey",
        date: new Date(1700000002000),
      },
    ]);

    // the embedded copies are gone
    const user = await db().collection("users").findOne({ _id: alice });
    expect(user).not.toHaveProperty("notifications");
    const oldComment = await db()
      .collection("comments")
      .findOne({ _id: comment });
    expect(oldComment).not.toHaveProperty("reply");
  });

  it("Should store every id as a string", async () => {
    const user = await db().collection("users").findOne({ _id: alice });
    expect(user?.friends).toEqual([String(bob)]);
    const oldPost = await db().collection("posts").findOne({ _id: post });
    expect(oldPost?.likes).toEqual([String(bob)]);
  });

  it("Should change nothing when run again", async () => {
    const report = await migrate(db(), true);
    expect(report.notificationsMoved).toEqual(0);
    expect(report.repliesMoved).toEqual(0);
    expect(report.documentsWithObjectIds).toEqual(0);
    expect(await db().collection("notifications").countDocuments()).toEqual(3);
    expect(await db().collection("replies").countDocuments()).toEqual(1);
  });
});

afterAll(async () => {
  await closeMongoServer();
});
