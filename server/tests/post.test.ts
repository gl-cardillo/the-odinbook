import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/user.js";
import Post from "../models/post.js";
import { initializeMongoServer, closeMongoServer } from "./mongoConfigTesting.js";
import { seed } from "./seed.js";
import { tokenFor, uploadAs } from "./helpers.js";

vi.mock("../config/s3.js", async (importOriginal) =>
  (await import("./helpers.js")).mockS3(importOriginal)
);

let token: string;
let userId: string;
// the 6 users created by the seed, users[0] is a friend of the logged in user
let users: InstanceType<typeof User>[];
let postId: string;
let commentId: string;

const notificationsOf = async (id: string) =>
  (
    await request(app)
      .get("/users/me/notifications")
      .set("Authorization", tokenFor(id))
  ).body.notifications;

beforeAll(async () => {
  await initializeMongoServer();
  await seed();
  const res = await request(app).post("/auth/signup").send({
    firstname: "Luca",
    lastname: "Cardi",
    email: "lucacardi@gmail.com",
    password: "password123",
  });
  token = `Bearer ${res.body.token}`;
  userId = res.body.user.id;
  users = await User.find({ _id: { $ne: userId } });
  await User.findByIdAndUpdate(userId, { friends: [users[0].id] });
});

describe("GET /posts", () => {
  it("should return the first page, newest first", async () => {
    const res = await request(app).get("/posts").set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(10);
    const dates = res.body.map((post: { date: string }) => post.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("should walk through every post page by page, without repeats", async () => {
    const seen: string[] = [];
    let before = "";
    for (let page = 0; page < 10; page++) {
      const res = await request(app)
        .get("/posts")
        .query(before ? { before, limit: 7 } : { limit: 7 })
        .set("Authorization", token);
      expect(res.statusCode).toEqual(200);
      seen.push(...res.body.map((post: { id: string }) => post.id));
      if (res.body.length < 7) break;
      before = res.body[res.body.length - 1].id;
    }
    expect(seen.length).toEqual(30);
    expect(new Set(seen).size).toEqual(30);
  });

  it("should include the author, the likes and the comments count", async () => {
    const res = await request(app).get("/posts").set("Authorization", token);
    const post = res.body[0];
    expect(post.author).toHaveProperty("id", post.authorId);
    expect(post.author).toHaveProperty("fullname");
    expect(Array.isArray(post.likedBy)).toBe(true);
    // the seed adds 5 comments from each of the 6 users to every post
    expect(post.commentsCount).toEqual(30);
  });
});

describe("GET /users/:userId/posts", () => {
  it("should return the posts of the user", async () => {
    const res = await request(app)
      .get(`/users/${users[0].id}/posts`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(5);
    expect(res.body[0]).toHaveProperty("authorId", users[0].id);
  });
});

describe("GET /posts/feed", () => {
  it("should return the posts of the user and their friends", async () => {
    const res = await request(app)
      .get("/posts/feed")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(5);
    expect(res.body[0]).toHaveProperty("authorId", users[0].id);
  });
});

describe("POST /posts", () => {
  it("should create the post as the logged in user", async () => {
    const res = await request(app)
      .post("/posts")
      .send({ text: "Post example", authorId: users[3].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(201);
    expect(res.body.text).toEqual("Post example");
    expect(res.body.authorId).toEqual(userId);
    expect(res.body.author).toHaveProperty("fullname", "Luca Cardi");
    expect(res.body.commentsCount).toEqual(0);

    postId = res.body.id;
  });

  it("should require some text", async () => {
    const res = await request(app)
      .post("/posts")
      .send({ text: "   " })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Text is required");
  });

  it("should refuse a picture outside the bucket", async () => {
    const res = await request(app)
      .post("/posts")
      .send({ text: "Post example", picUrl: "https://example.com/a.png" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
  });

  it("should accept a picture the user uploaded", async () => {
    const picUrl = await uploadAs(app, token);
    const res = await request(app)
      .post("/posts")
      .send({ text: "With picture", picUrl })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(201);
    expect(res.body.picUrl).toEqual(picUrl);
  });

  it("should limit the length of a post", async () => {
    const res = await request(app)
      .post("/posts")
      .send({ text: "a".repeat(5001) })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Posts can be at most 5000 characters");
  });
});

describe("Post likes", () => {
  it("should like as the logged in user and answer with the likes", async () => {
    const res = await request(app)
      .put(`/posts/${postId}/like`)
      .set("Authorization", tokenFor(users[2].id));
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([
      { id: users[2].id, fullname: users[2].fullname, profilePicUrl: expect.any(String) },
    ]);
  });

  it("should not count the same like twice", async () => {
    const res = await request(app)
      .put(`/posts/${postId}/like`)
      .set("Authorization", tokenFor(users[2].id));
    expect(res.body.length).toEqual(1);
  });

  it("should notify the post author once", async () => {
    const notifications = await notificationsOf(userId);
    expect(notifications.length).toEqual(1);
    expect(notifications[0].fullname).toEqual(users[2].fullname);
    expect(notifications[0].message).toEqual("liked your post");
    expect(notifications[0].elementId).toEqual(postId);
  });

  it("should list who liked the post", async () => {
    const res = await request(app)
      .get(`/posts/${postId}/likes`)
      .set("Authorization", token);
    expect(res.body.map((u: { id: string }) => u.id)).toEqual([users[2].id]);
  });

  it("should remove the like", async () => {
    const res = await request(app)
      .delete(`/posts/${postId}/like`)
      .set("Authorization", tokenFor(users[2].id));
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });
});

describe("Comments", () => {
  it("should create the comment as the logged in user", async () => {
    const res = await request(app)
      .post(`/posts/${postId}/comments`)
      .set("Authorization", tokenFor(users[0].id))
      .send({ text: "Comment example", authorId: userId });
    expect(res.statusCode).toEqual(201);
    expect(res.body.text).toEqual("Comment example");
    expect(res.body.postId).toEqual(postId);
    expect(res.body.authorId).toEqual(users[0].id);
    expect(res.body.author).toHaveProperty("fullname", users[0].fullname);

    commentId = res.body.id;
  });

  it("should notify the post author", async () => {
    const [latest] = await notificationsOf(userId);
    expect(latest.fullname).toEqual(users[0].fullname);
    expect(latest.message).toEqual("commented your post");
    expect(latest.seen).toEqual(false);
    expect(latest.elementId).toEqual(postId);
  });

  it("should list the comments of the post", async () => {
    const res = await request(app)
      .get(`/posts/${postId}/comments`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(1);
    expect(res.body[0].author).toHaveProperty("fullname", users[0].fullname);
    expect(res.body[0].likedBy).toEqual([]);
  });

  it("should limit the length of a comment", async () => {
    const res = await request(app)
      .post(`/posts/${postId}/comments`)
      .set("Authorization", token)
      .send({ text: "a".repeat(2001) });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Comments can be at most 2000 characters");
  });

  it("should answer 404 for a post that does not exist", async () => {
    const res = await request(app)
      .post("/posts/000000000000000000000000/comments")
      .set("Authorization", token)
      .send({ text: "Comment example" });
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("Post not found");
  });

  it("should like a comment and notify its author", async () => {
    const res = await request(app)
      .put(`/comments/${commentId}/like`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.map((u: { id: string }) => u.id)).toEqual([userId]);

    const [latest] = await notificationsOf(users[0].id);
    expect(latest.message).toEqual("liked your comment");
  });

  it("should add a reply and notify the comment author", async () => {
    const res = await request(app)
      .post(`/comments/${commentId}/replies`)
      .set("Authorization", token)
      .send({ text: "Reply example" });
    expect(res.statusCode).toEqual(201);

    const replies = await request(app)
      .get(`/comments/${commentId}/replies`)
      .set("Authorization", token);
    expect(replies.body.length).toEqual(1);
    expect(replies.body[0]).toMatchObject({
      authorId: userId,
      authorFullname: "Luca Cardi",
      text: "Reply example",
    });

    const [latest] = await notificationsOf(users[0].id);
    expect(latest.message).toEqual("replied to your comment");
  });

  it("should only let the author delete a reply", async () => {
    const replies = await request(app)
      .get(`/comments/${commentId}/replies`)
      .set("Authorization", token);
    const { date } = replies.body[0];

    const notMine = await request(app)
      .delete(`/comments/${commentId}/replies/${date}`)
      .set("Authorization", tokenFor(users[0].id));
    expect(notMine.statusCode).toEqual(404);

    const mine = await request(app)
      .delete(`/comments/${commentId}/replies/${date}`)
      .set("Authorization", token);
    expect(mine.statusCode).toEqual(204);

    const notifications = await notificationsOf(users[0].id);
    expect(
      notifications.some(
        (n: { message: string }) => n.message === "replied to your comment"
      )
    ).toBe(false);
  });

  it("should not delete the comment of another user", async () => {
    const res = await request(app)
      .delete(`/comments/${commentId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(403);
  });

  it("should delete your own comment and its notifications", async () => {
    const res = await request(app)
      .delete(`/comments/${commentId}`)
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(204);

    const comments = await request(app)
      .get(`/posts/${postId}/comments`)
      .set("Authorization", token);
    expect(comments.body).toEqual([]);

    // the post author is not told about a comment that no longer exists
    const notifications = await notificationsOf(userId);
    expect(
      notifications.some(
        (n: { message: string }) => n.message === "commented your post"
      )
    ).toBe(false);
  });
});

describe("Protected routes", () => {
  it("should return 401 without a token", async () => {
    const res = await request(app).delete(`/posts/${postId}`);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 401 with an invalid or expired token", async () => {
    const expired = jwt.sign({}, process.env.ACCESS_TOKEN_SECRET!, {
      subject: userId,
      expiresIn: -10,
    });
    for (const header of [
      "Bearer not-a-token",
      "Bearer undefined",
      "token",
      `Bearer ${expired}`,
    ]) {
      const res = await request(app)
        .delete(`/posts/${postId}`)
        .set("Authorization", header);
      expect(res.statusCode).toEqual(401);
    }
  });

  it("should need a login to read posts", async () => {
    const res = await request(app).get(`/posts/${postId}`);
    expect(res.statusCode).toEqual(401);
  });
});

describe("DELETE /posts/:postId", () => {
  it("should not delete the post of another user", async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(403);
    expect(await Post.exists({ _id: postId })).toBeTruthy();
  });

  it("should answer 404 when the post does not exist", async () => {
    const res = await request(app)
      .delete("/posts/000000000000000000000000")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("Post not found");
  });

  it("should delete the post", async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(204);
  });

  it("should answer 404 for the deleted post", async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(404);
  });
});

afterAll(async () => {
  await closeMongoServer();
});
