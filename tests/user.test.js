require("dotenv").config();
const app = require("../app");
const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post");

let token;
let userId;
let users;

const { initializeMongoServer } = require("./mongoConfigTesting");
const { seed } = require("./seed");

initializeMongoServer();

beforeAll(async () => {
  await seed();
});

describe("POST auth/signin", () => {
  it("Should create a new user", async () => {
    const res = await request(app)
      .post("/auth/signin")
      .send({
        firstname: "Luca",
        lastname: "Cardi",
        email: "lucacardi@gmail.com",
        password: "password123",
      })
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("firstname", "Luca");
    expect(res.body.user).toHaveProperty("lastname", "Cardi");
    expect(res.body.user).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body.user).toHaveProperty("password");
    expect(res.body.user).toHaveProperty("profilePicUrl");
    expect(res.body.user).toHaveProperty("friends");
    expect(res.body.user).toHaveProperty("friendRequests");
    expect(res.body.user).toHaveProperty("fullname");

    user = await User.findById(res.body.user.id);
    //get 6 users created in seed
    users = await User.find({ _id: { $ne: res.body.user.id } });
    //set token
    token = res.body.token;
  });
});

describe("POST auth/login", () => {
  it("Should login successfully", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "lucacardi@gmail.com",
        password: "password123",
      })
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("firstname", "Luca");
    expect(res.body.user).toHaveProperty("lastname", "Cardi");
    expect(res.body.user).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body.user).toHaveProperty("password");
    expect(res.body.user).toHaveProperty("profilePicUrl");
    expect(res.body.user).toHaveProperty("friends");
    expect(res.body.user).toHaveProperty("friendRequests");
    expect(res.body.user).toHaveProperty("fullname");

    userId = res.body.user.id;
  });
});

describe("GET /user/profile/:profileId", () => {
  it("Should return the user by the id", async () => {
    const res = await request(app)
      .get(`/user/profile/${userId}`)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("id", userId);
    expect(res.body).toHaveProperty("firstname", "Luca");
    expect(res.body).toHaveProperty("lastname", "Cardi");
    expect(res.body).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body).toHaveProperty("password");
    expect(res.body).toHaveProperty("profilePicUrl");
    expect(res.body).toHaveProperty("friends");
    expect(res.body).toHaveProperty("friendRequests");
    expect(res.body).toHaveProperty("fullname");
  });
});

describe("GET /user/getsuggestedProfile/:userId", () => {
  it("Should return all the profile  that are not friend with the user", async () => {
    const res = await request(app)
      .get(`/user/getsuggestedProfile/${userId}`)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.length).toEqual(6);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("firstname");
    expect(res.body[0]).toHaveProperty("lastname");
    expect(res.body[0]).toHaveProperty("email");
    expect(res.body[0]).toHaveProperty("password");
    expect(res.body[0]).toHaveProperty("profilePicUrl");
    expect(res.body[0]).toHaveProperty("friends");
    expect(res.body[0]).toHaveProperty("friendRequests");
    expect(res.body[0]).toHaveProperty("fullname");
  });
});

describe("GET /user/get3suggestedProfile/:userId", () => {
  it("Should return 3 profile that are not friend with the user", async () => {
    const res = await request(app)
      .get(`/user/get3suggestedProfile/${userId}`)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.length).toEqual(3);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("firstname");
    expect(res.body[0]).toHaveProperty("lastname");
    expect(res.body[0]).toHaveProperty("email");
    expect(res.body[0]).toHaveProperty("password");
    expect(res.body[0]).toHaveProperty("profilePicUrl");
    expect(res.body[0]).toHaveProperty("friends");
    expect(res.body[0]).toHaveProperty("friendRequests");
    expect(res.body[0]).toHaveProperty("fullname");
  });
});

describe("PUT /user/sendFriendRequest", () => {
  it("Should send a friend request to the other user", async () => {
    const res = await request(app)
      .put("/user/sendFriendRequest")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(
      `User with id ${userId} send friend request to user with id ${users[0].id}`
    );
  });

  it("Should return request is pending if asked twice", async () => {
    const res = await request(app)
      .put("/user/sendFriendRequest")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(`Request already pending`);
  });

  it("Shouldn't allow to ask the request to themself", async () => {
    const res = await request(app)
      .put("/user/sendFriendRequest")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: userId,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(
      "User can send request only to other user"
    );
  });
});

describe("GET /user/friendRequests/:userId", () => {
  it("Should return the friends requests with id, profilePicUrl and fullname for each user", async () => {
    const res = await request(app)
      .get(`/user/friendRequests/${users[0].id}`)
      .set("Accept", "application/json")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body[0].id).toEqual(userId);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("profilePicUrl");
    expect(res.body[0]).toHaveProperty("fullname");
  });
});

describe("PUT /user/acceptFriendRequest", () => {
  it("should not accept the request if there isn't one from that user", async () => {
    const res = await request(app)
      .put("/user/acceptFriendRequest")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(`No request to accept`);
  });

  it("should accept the friend request if there is one from that user", async () => {
    //add friend request to user
    user.friendRequests = [users[0].id];
    await user.save();

    const res = await request(app)
      .put("/user/acceptFriendRequest")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(
      `Users with id ${userId} accepted friend request of user with id ${users[0].id}`
    );
  });
});

describe("Get /user/friends/:userId", () => {
  it("Should get the id, profilePicUrl, fullname of the user's friend", async () => {
    const res = await request(app)
      .get(`/user/friends/${userId}`)
      .set("Accept", "application/json")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body[0].id).toEqual(users[0].id);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("profilePicUrl");
    expect(res.body[0]).toHaveProperty("fullname");
  });
});

describe("PUT user/removeFriend", () => {
  it("Should remove the friendship", async () => {
    const res = await request(app)
      .put("/user/removeFriend")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(
      `Users with id ${userId} remove friendship with id ${users[0].id}`
    );
  });

  it("Should return 404 is users are not friend ", async () => {
    const res = await request(app)
      .put("/user/removeFriend")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(404);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual("Users are not friend");
  });
});

describe("PUT user/removeFriendRequest", () => {
  it("should not decline the request if there isn't one from that user", async () => {
    const res = await request(app)
      .put("/user/declineFriendRequest")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(`No request to decline`);
  });

  it("should decline the request if there is one from that user", async () => {
    //add friend request to user
    const friendRequest = await request(app)
      .put("/user/sendFriendRequest")
      .set("Accept", "application/json")
      .send({
        profileId: userId,
        userId: users[0].id,
      })
      .set("Authorization", token);

    const res = await request(app)
      .put("/user/declineFriendRequest")
      .set("Accept", "application/json")
      .send({
        userId,
        profileId: users[0].id,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(
      `Users with id ${userId} decline friend request of user with id ${users[0].id}`
    );
  });
});

describe("PUT /user/changePic", () => {
  it("Should change the profile pic url", async () => {
    const res = await request(app)
      .put(`/user/changePic`)
      .set("Accept", "application/json")
      .send({
        imageUrl: "www.urlExample.com",
        id: userId,
      })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual(`Profile picture changed`);
  });
});

describe("GET /user/profilePicUrl", () => {
  it("Should return the url hosted in the amazon bucket", async () => {
    const res = await request(app)
      .get(`/user/profilePic/${userId}`)
      .set("Accept", "application/json")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toMatch("https://myawsbucket-gl-cardi.s3.eu-west-2.amazonaws.com/6cfd21bd1531475c0d00f7cc8de66fcb")
  })
});

describe("PUT /user/updateProfile", () => {
  it("Should update the account", async () => {
    const res = await request(app)
      .put("/user/updateProfile")
      .set("Accept", "application/json")
      .set("Authorization", token)
      .send({
        id: userId,
        firstname: "update",
        lastname: "account",
        gender: "Male",
        dateOfBirth: "1995-10-30",
        hometown: "New york",
        worksAt: "Google",
        school: "MIT",
        relationship: "Single",
      });
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
  });
  it("Should fine the account updated", async () => {
    const res = await request(app)
      .get(`/user/profile/${userId}`)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("id", userId);
    expect(res.body).toHaveProperty("firstname", "update");
    expect(res.body).toHaveProperty("lastname", "account");
    expect(res.body).toHaveProperty("gender", "Male");
    expect(res.body).toHaveProperty("dateOfBirth", "1995-10-30T00:00:00.000Z");
    expect(res.body).toHaveProperty("hometown", "New york");
    expect(res.body).toHaveProperty("worksAt", "Google");
    expect(res.body).toHaveProperty("school", "MIT");
    expect(res.body).toHaveProperty("relationship", "Single");

  });
});
describe("DELETE /user/deleteAccount", () => {
  it("Should delete the account", async () => {
    const res = await request(app)
      .delete("/user/deleteAccount")
      .set("Accept", "application/json")
      .set("Authorization", token)
      .send({
        id: userId,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual("User deleted");
  });

  it("Should return 404 when GET the deleted user", async () => {
    const res = await request(app)
      .get(`/user/profile/${userId}`)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(404);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body.message).toEqual("No user found");
  });
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});
