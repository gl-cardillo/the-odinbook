import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/user.js";
import Post from "../models/post.js";
import { initializeMongoServer, closeMongoServer } from "./mongoConfigTesting.js";
import { seed } from "./seed.js";
import { tokenFor, bucketUrl } from "./helpers.js";

vi.mock("../config/s3.js", async (importOriginal) =>
  (await import("./helpers.js")).mockS3(importOriginal)
);

let token: string;
let userId: string;
// the 6 users created by the seed, users[0] is a friend of the logged in user
let users: InstanceType<typeof User>[];
let postId: string;
let commentId: string;
let commentDate: string;

beforeAll(async () => {
  await initializeMongoServer();
  await seed();
  const res = await request(app)
    .post("/auth/signin")
    .send({
      firstname: "Luca",
      lastname: "Cardi",
      email: "lucacardi@gmail.com",
      password: "password123",
    })
    .set("Accept", "application/json");
  token = `Bearer ${res.body.token}`;
  userId = res.body.user.id;
  users = await User.find({ _id: { $ne: userId } });
  await User.findByIdAndUpdate(userId, { friends: [users[0].id] });
});

describe("GET /posts", () => {
  it("should return all the posts", async () => {
    const res = await request(app).get("/posts").set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("_id");
    expect(res.body[0]).toHaveProperty("authorId");
    expect(res.body[0]).toHaveProperty("text");
    expect(res.body[0]).toHaveProperty("date");
    expect(res.body[0]).toHaveProperty("likes");
    expect(res.body.length).toEqual(30);
  });
});

describe("GET /posts/byUserId/:userId", () => {
  it("should return all the posts of the user", async () => {
    const res = await request(app)
      .get(`/posts/byUserId/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("authorId", users[0].id);
    expect(res.body.length).toEqual(5);
  });
});

describe("Get posts/getFriendsPost/:userId", () => {
  it("should return only the posts of the user's friend", async () => {
    const res = await request(app)
      .get(`/posts/getFriendsPost/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(5);
    expect(res.body[0]).toHaveProperty("authorId", users[0].id);
  });
});

describe("POST /posts/createPost", () => {
  it("should create the post as the logged in user, whatever the body says", async () => {
    const res = await request(app)
      .post("/posts/createPost")
      .send({ text: "Post example", authorId: users[3].id, picUrl: "" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.post.text).toEqual("Post example");
    expect(res.body.post.authorId).toEqual(userId);

    postId = res.body.post.id;
    await Post.findByIdAndUpdate(postId, { likes: [users[0].id, users[1].id] });
  });

  it("should refuse a picture outside the bucket", async () => {
    const res = await request(app)
      .post("/posts/createPost")
      .send({ text: "Post example", picUrl: "https://example.com/a.png" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
  });

  it("should accept a picture from the bucket", async () => {
    const res = await request(app)
      .post("/posts/createPost")
      .send({ text: "With picture", picUrl: bucketUrl("picture") })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
  });
});

describe("POST /comments/createComment", () => {
  it("should create the comment as the logged in user", async () => {
    const res = await request(app)
      .post("/comments/createComment")
      .set("Authorization", tokenFor(users[0].id))
      .send({ text: "Comment example", postId, authorId: userId });
    expect(res.statusCode).toEqual(200);
    expect(res.body.text).toEqual("Comment example");
    expect(res.body.postId).toEqual(postId);
    expect(res.body.authorId).toEqual(users[0].id);

    commentId = res.body.id;
    commentDate = res.body.date;
  });

  it("should send a notification to the post author", async () => {
    const res = await request(app)
      .get(`/user/getNotification/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.notifications[0].fullname).toEqual(users[0].fullname);
    expect(res.body.notifications[0].message).toEqual("commented your post");
    expect(res.body.notifications[0].seen).toEqual(false);
    expect(res.body.notifications[0].elementId).toEqual(postId);
    expect(res.body.unchecked.length).toEqual(1);
  });

  it("should return 404 for a post that does not exist", async () => {
    const res = await request(app)
      .post("/comments/createComment")
      .set("Authorization", token)
      .send({ text: "Comment example", postId: "000000000000000000000000" });
    expect(res.statusCode).toEqual(404);
  });
});

describe("GET /comments/:postId", () => {
  it("Should return only the comment from one post", async () => {
    const res = await request(app)
      .get(`/comments/${postId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].authorId).toEqual(users[0].id);
    expect(res.body[0].text).toEqual("Comment example");
    expect(res.body[0].postId).toEqual(postId);
  });
});

describe("DELETE /comments/deleteComment", () => {
  it("Should not delete the comment of another user", async () => {
    const res = await request(app)
      .delete(`/comments/deleteComment`)
      .set("Authorization", token)
      .send({ id: commentId, date: commentDate });
    expect(res.statusCode).toEqual(403);
  });

  it("Should delete your own comment", async () => {
    const res = await request(app)
      .delete(`/comments/deleteComment`)
      .set("Authorization", tokenFor(users[0].id))
      .send({ id: commentId, date: commentDate });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(`Comment with id ${commentId} deleted`);
  });

  it("Get the comments of the post should return an empty array", async () => {
    const res = await request(app)
      .get(`/comments/${postId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(0);
  });
});

describe("GET posts/getLikes/:postId", () => {
  it("should return who liked the post", async () => {
    const res = await request(app)
      .get(`/posts/getLikes/${postId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].id).toEqual(users[0].id);
    expect(res.body[1].id).toEqual(users[1].id);
    expect(res.body.length).toEqual(2);
  });
});

describe("PUT posts/addLike", () => {
  it("should add the like as the logged in user", async () => {
    const res = await request(app)
      .put("/posts/addLike")
      .send({ elementId: postId, userId, elementAuthorId: users[4].id })
      .set("Authorization", tokenFor(users[2].id));
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `User with id ${users[2].id} added a like from post with id ${postId}`
    );
  });

  it("should notify the real post author, not the one in the body", async () => {
    const res = await request(app)
      .get(`/user/getNotification/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.notifications[0].fullname).toEqual(users[2].fullname);
    expect(res.body.notifications[0].message).toEqual("liked your post");
    expect(res.body.notifications[0].elementId).toEqual(postId);

    const other = await User.findById(users[4].id).select("notifications");
    expect(other?.notifications.length).toEqual(0);
  });

  it("should remove the like", async () => {
    const res = await request(app)
      .put("/posts/addLike")
      .send({ elementId: postId })
      .set("Authorization", tokenFor(users[2].id));
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `User with id ${users[2].id} removed the like from post with id ${postId}`
    );
  });
});

describe("Protected routes", () => {
  it("should return 401 without a token", async () => {
    const res = await request(app)
      .delete("/posts/deletePost")
      .send({ id: postId });
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
        .delete("/posts/deletePost")
        .send({ id: postId })
        .set("Authorization", header);
      expect(res.statusCode).toEqual(401);
    }
  });

  it("should need a login to read posts", async () => {
    const res = await request(app).get(`/posts/byPostId/${postId}`);
    expect(res.statusCode).toEqual(401);
  });
});

describe("DELETE /posts/deletePost", () => {
  it("should not delete the post of another user", async () => {
    const res = await request(app)
      .delete("/posts/deletePost")
      .send({ id: postId })
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(403);
    expect(await Post.exists({ _id: postId })).toBeTruthy();
  });

  it("should delete a post created without picUrl", async () => {
    const created = await request(app)
      .post("/posts/createPost")
      .send({ text: "No picture" })
      .set("Authorization", token);
    const res = await request(app)
      .delete("/posts/deletePost")
      .send({ id: created.body.post.id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
  });

  it("should return 404 when the post does not exist", async () => {
    const res = await request(app)
      .delete("/posts/deletePost")
      .send({ id: "000000000000000000000000" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("Post not found");
  });

  it("should delete the post", async () => {
    const res = await request(app)
      .delete("/posts/deletePost")
      .send({ id: postId })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `Post with id ${postId} deleted with comments`
    );
  });

  it("Get deleted post should return 404", async () => {
    const res = await request(app)
      .get(`/posts/byPostId/${postId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual(`No post found`);
  });
});

afterAll(async () => {
  await closeMongoServer();
});
