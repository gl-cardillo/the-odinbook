require("dotenv").config();
const app = require("../app");
const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post");

let token;
let userId;
let users;
let postId;
let commentId;
let authorPostId;

const { initializeMongoServer } = require("./mongoConfigTesting");
const { seed } = require("./seed");

initializeMongoServer();

beforeAll(async () => {
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
  token = res.body.token;
  userId = res.body.user.id;
  //get current user
  const user = await User.findById(res.body.user.id);
  //get 6 users created in seed
  users = await User.find({ _id: { $ne: res.body.user.id } });
  // make one of the users created in seed friend with current user
  user.friends = [users[0].id];
  await user.save();
  return;
});

describe("GET /posts", () => {
  it("should return 6 posts", async () => {
    const res = await request(app)
      .get("/posts")
      .set("Authorization", token);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body[0]).toHaveProperty("_id");
    expect(res.body[0]).toHaveProperty("authorId");
    expect(res.body[0]).toHaveProperty("text");
    expect(res.body[0]).toHaveProperty("date");
    expect(res.body[0]).toHaveProperty("likes");
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(30);
  });
});

describe("GET /posts/byUserId/:userId", () => {
  it("  should return all the posts  of the user", async () => {
    const res = await request(app)
      .get(`/posts/byUserId/${users[0].id}`)
      .set("Accept", "application/json");
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body[0]).toHaveProperty("_id");
    expect(res.body[0]).toHaveProperty("authorId", users[0].id);
    expect(res.body[0]).toHaveProperty("text");
    expect(res.body[0]).toHaveProperty("date");
    expect(res.body[0]).toHaveProperty("likes");
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(5);
  });
});

describe("Get posts/getFriendsPost/:userId", () => {
  it("should return only the posts of the user's friend", async () => {
    const res = await request(app)
      .get(`/posts/getFriendsPost/${userId}`)
      .set("Accept", "application/json");
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(5);
    expect(res.body[0]).toHaveProperty("authorId", users[0].id);
  });
});

describe("Post /posts/", () => {
  it("should return the new post", async () => {
    const res = await request(app)
      .post("/posts/createPost")
      .send({
        text: "Post example",
        authorId: user.id,
      })
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("post");
    expect(res.body.post.text).toEqual("Post example");
    expect(res.statusCode).toEqual(200);

    postId = res.body.post.id;
    authorPostId = res.body.post.authorId;
    //add likes to post
    const post = await Post.findById(postId);
    post.likes = [users[0].id, users[1].id];
    post.save();
  });
});

describe("POST /comments/createComment", () => {

  it("should create a new comment", async () => {
    const res = await request(app)
      .post("/comments/createComment")
      .set("Accept", "application/json")
      .set("Authorization", token)
      .send({
        text: "Comment example",
        postId,
        authorId : user.id,
        authorFullname: user.fullname,
        authorPostId: userId
      });
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);
    expect(res.body.text).toEqual("Comment example");
    expect(res.body.postId).toEqual(postId);

    commentId = res.body.id;
  });

  it("should send a notification to post author", async () => {
    const res = await request(app)
      .get(`/user/getNotification/${userId}`)
      .set("Accept", "application/json")
      .set("Authorization", token);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);

    expect(res.body[0].message).toEqual(`${user.fullname} commented your post`);
    expect(res.body[0].seen).toEqual(false);
    expect(res.body[0].elementId).toEqual(postId);
  });
});

describe("GET /comments/:postId", () => {
  it("Should return only the comment from one post", async () => {
    const res = await request(app)
      .get(`/comments/${postId}`)
      .set("Accept", "application/json");
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200)
    expect(res.body[0].authorId).toEqual(authorPostId);
    expect(res.body[0].text).toEqual("Comment example");
    expect(res.body[0].postId).toEqual(postId);
  });
});

describe("DELETE /comments/deleteComment", () => {
  it("Should delete the post", async () => {
    const res = await request(app)
      .delete(`/comments/deleteComment`)
      .set("Accept", "application/json")
      .set("Authorization", token)
      .send({
        id: commentId,
      });
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(`Comment with id ${commentId} deleted`);
  });

  it("Get the posts removed should return an empty array ", async () => {
    const res = await request(app)
      .get(`/comments/${postId}`)
      .set("Accept", "application/json");
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(0);
  });
});

describe("GET posts/getLikes/:postId", () => {
  it("should return the number of likes per post", async () => {
    const res = await request(app)
      .get(`/posts/getLikes/${postId}`)
      .set("Accept", "application/json");
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].id).toEqual(users[0].id);
    expect(res.body[1].id).toEqual(users[1].id);
    expect(res.body.length).toEqual(2);
  });
});

describe("PUT posts/addLike", () => {
  it("should add the like", async () => {
    const res = await request(app)
      .put("/posts/addLike")
      .send({
        elementId: postId,
        userId,
        elementAuthorId: authorPostId,
        userFullname: user.fullname,
      })
      .set("Accept", "application/json")
      .set("Authorization", token);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `User with id ${userId} added a like from post with id ${postId}`
    );
  });

    it("should send a notification to post author", async () => {
      const res = await request(app)
        .get(`/user/getNotification/${authorPostId}`)
        .set("Accept", "application/json")
        .set("Authorization", token);
      expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
      expect(res.statusCode).toEqual(200);
      expect(res.body[0].message).toEqual(`${user.fullname} liked your post`);
      expect(res.body[0].seen).toEqual(false);
      expect(res.body[0].elementId).toEqual(postId);
    });

  it("should remove the like", async () => {
    const res = await request(app)
      .put("/posts/addLike")
      .send({
        elementId: postId,
        userId,
        elementAuthorId: authorPostId,
        userFullname: user.fullname,
      })
      .set("Accept", "application/json")
      .set("Authorization", token);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `User with id ${userId} removed the like from post with id ${postId}`
    );
  });
});

describe("DELETE /posts/deletePost", () => {
  it("should delete the post", async () => {
    const res = await request(app)
      .delete("/posts/deletePost")
      .send({
        id: postId,
      })
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(
      `Post with id ${postId} deleted with comments`
    );
  });

  it("Get deleted post should return 404", async () => {
    const res = await request(app)
      .get(`/posts/byPostId/${postId}`)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(404);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(`No post found`);
  });
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});
