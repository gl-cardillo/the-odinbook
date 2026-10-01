import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/user.js";
import { TEST_ACCOUNT_EMAIL } from "../config/env.js";
import { initializeMongoServer, closeMongoServer } from "./mongoConfigTesting.js";
import { seed } from "./seed.js";
import { tokenFor, bucketUrl } from "./helpers.js";

vi.mock("../config/s3.js", async (importOriginal) =>
  (await import("./helpers.js")).mockS3(importOriginal)
);

let token: string;
let userId: string;
// the 6 users created by the seed
let users: InstanceType<typeof User>[];

beforeAll(async () => {
  await initializeMongoServer();
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
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).toHaveProperty("profilePicUrl");
    expect(res.body.user).toHaveProperty("friends");
    expect(res.body.user).toHaveProperty("friendRequests");
    expect(res.body.user).toHaveProperty("fullname");

    users = await User.find({ _id: { $ne: res.body.user.id } });
  });

  it("Should reject an invalid email", async () => {
    const res = await request(app).post("/auth/signin").send({
      firstname: "Luca",
      lastname: "Cardi",
      email: "not-an-email",
      password: "password123",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("A valid email is required");
  });

  it("Should reject an email already used", async () => {
    const res = await request(app).post("/auth/signin").send({
      firstname: "Luca",
      lastname: "Cardi",
      email: "lucacardi@gmail.com",
      password: "password123",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("User already exists");
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
    expect(res.body.user).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body.user).not.toHaveProperty("password");

    userId = res.body.user.id;
    token = `Bearer ${res.body.token}`;
  });

  it("Should give the same answer for a wrong password and an unknown email", async () => {
    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: "lucacardi@gmail.com", password: "wrong-password1" });
    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("Invalid email or password");
    }
  });
});

describe("Token", () => {
  it("Should only carry the user id and expire", () => {
    const payload = jwt.decode(token.split(" ")[1]) as jwt.JwtPayload;
    expect(payload.sub).toEqual(userId);
    expect(payload).not.toHaveProperty("user");
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it("Should not accept the old tokens with the whole user inside", async () => {
    const oldToken = jwt.sign(
      { user: { _id: userId } },
      process.env.ACCESS_TOKEN_SECRET!
    );
    const res = await request(app)
      .get("/user/")
      .set("Authorization", `Bearer ${oldToken}`);
    expect(res.statusCode).toEqual(401);
  });

  it("Should keep the password hashed in the database", async () => {
    const saved = await User.findById(userId).select("+password");
    expect(saved?.password).toMatch(/^\$2[aby]\$/);
  });
});

describe("GET /user/", () => {
  it("Should need a login", async () => {
    const res = await request(app).get("/user/");
    expect(res.statusCode).toEqual(401);
  });

  it("Should not expose passwords, emails or notifications of other users", async () => {
    const res = await request(app).get("/user/").set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(7);
    for (const profile of res.body) {
      expect(profile).not.toHaveProperty("password");
      expect(profile).not.toHaveProperty("notifications");
      if (profile.id !== userId) {
        expect(profile).not.toHaveProperty("email");
      }
    }
  });
});

describe("GET /user/profile/:profileId", () => {
  it("Should return your own profile with the email", async () => {
    const res = await request(app)
      .get(`/user/profile/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("id", userId);
    expect(res.body).toHaveProperty("firstname", "Luca");
    expect(res.body).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body).not.toHaveProperty("password");
    expect(res.body).toHaveProperty("fullname");
  });

  it("Should hide the email of other users", async () => {
    const res = await request(app)
      .get(`/user/profile/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("fullname", users[0].fullname);
    expect(res.body).not.toHaveProperty("email");
  });
});

describe("Suggested profiles", () => {
  it("Should return all the profiles that are not friend with the user", async () => {
    const res = await request(app)
      .get(`/user/getsuggestedProfile/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(6);
    expect(res.body[0]).toHaveProperty("fullname");
    expect(res.body[0]).not.toHaveProperty("email");
  });

  it("Should return 3 profiles", async () => {
    const res = await request(app)
      .get(`/user/get3suggestedProfile/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(3);
  });

  it("Should not show the suggestions of another user", async () => {
    const res = await request(app)
      .get(`/user/getsuggestedProfile/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(403);
  });
});

describe("PUT /user/sendFriendRequest", () => {
  it("Should send the request as the logged in user, whatever the body says", async () => {
    const res = await request(app)
      .put("/user/sendFriendRequest")
      .send({ userId: users[5].id, profileId: users[0].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `User with id ${userId} send friend request to user with id ${users[0].id}`
    );
    const receiver = await User.findById(users[0].id);
    expect(receiver?.friendRequests).toEqual([userId]);
  });

  it("Should return request is pending if asked twice", async () => {
    const res = await request(app)
      .put("/user/sendFriendRequest")
      .send({ profileId: users[0].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual(`Request already pending`);
  });

  it("Shouldn't allow to ask the request to themself", async () => {
    const res = await request(app)
      .put("/user/sendFriendRequest")
      .send({ profileId: userId })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual(
      "User can send request only to other user"
    );
  });
});

describe("GET /user/friendRequests/:userId", () => {
  it("Should return the requests received by the logged in user", async () => {
    const res = await request(app)
      .get(`/user/friendRequests/${users[0].id}`)
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].id).toEqual(userId);
    expect(res.body[0]).toHaveProperty("profilePicUrl");
    expect(res.body[0]).toHaveProperty("fullname");
  });

  it("Should not show the requests of another user", async () => {
    const res = await request(app)
      .get(`/user/friendRequests/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(403);
  });
});

describe("PUT /user/acceptFriendRequest", () => {
  it("should not accept the request if there isn't one from that user", async () => {
    const res = await request(app)
      .put("/user/acceptFriendRequest")
      .send({ profileId: users[1].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual(`No request to accept`);
  });

  it("should accept the request as the user who received it", async () => {
    const res = await request(app)
      .put("/user/acceptFriendRequest")
      .send({ profileId: userId })
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `Users with id ${users[0].id} accepted friend request of user with id ${userId}`
    );
  });
});

describe("Get /user/friends/:userId", () => {
  it("Should get the id, profilePicUrl, fullname of the user's friend", async () => {
    const res = await request(app)
      .get(`/user/friends/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].id).toEqual(users[0].id);
    expect(res.body[0]).toHaveProperty("profilePicUrl");
    expect(res.body[0]).toHaveProperty("fullname");
  });
});

describe("PUT user/removeFriend", () => {
  it("Should remove the friendship", async () => {
    const res = await request(app)
      .put("/user/removeFriend")
      .send({ profileId: users[0].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `Users with id ${userId} remove friendship with id ${users[0].id}`
    );
  });

  it("Should return 404 is users are not friend ", async () => {
    const res = await request(app)
      .put("/user/removeFriend")
      .send({ profileId: users[0].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("Users are not friend");
  });
});

describe("PUT user/declineFriendRequest", () => {
  it("should not decline the request if there isn't one from that user", async () => {
    const res = await request(app)
      .put("/user/declineFriendRequest")
      .send({ profileId: users[0].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual(`No request to decline`);
  });

  it("should decline the request if there is one from that user", async () => {
    await request(app)
      .put("/user/sendFriendRequest")
      .send({ profileId: userId })
      .set("Authorization", tokenFor(users[0].id));

    const res = await request(app)
      .put("/user/declineFriendRequest")
      .send({ profileId: users[0].id })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      `Users with id ${userId} decline friend request of user with id ${users[0].id}`
    );
  });
});

describe("Notifications", () => {
  it("Should not show the notifications of another user", async () => {
    const res = await request(app)
      .get(`/user/getNotification/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(403);
  });
});

describe("GET /user/generateUrlS3", () => {
  it("Should only sign uploads of images", async () => {
    const pdf = await request(app)
      .get("/user/generateUrlS3?type=application/pdf")
      .set("Authorization", token);
    expect(pdf.statusCode).toEqual(400);

    const png = await request(app)
      .get("/user/generateUrlS3?type=image/png")
      .set("Authorization", token);
    expect(png.statusCode).toEqual(200);
  });
});

describe("PUT /user/changePic", () => {
  it("Should refuse a picture outside the bucket", async () => {
    const res = await request(app)
      .put(`/user/changePic`)
      .send({ imageUrl: "https://example.com/picture.png" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Invalid picture url");
  });

  it("Should change the profile pic url", async () => {
    const res = await request(app)
      .put(`/user/changePic`)
      .send({ imageUrl: bucketUrl("new-picture"), profileOrCover: "profilePicUrl" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(`Profile picture changed`);
  });
});

describe("GET /user/profilePic/:userId", () => {
  it("Should return the url hosted in the amazon bucket", async () => {
    const res = await request(app)
      .get(`/user/profilePic/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(bucketUrl("new-picture"));
  });
});

describe("PUT /user/updateProfile", () => {
  it("Should update the logged in account, whatever id the body says", async () => {
    const res = await request(app)
      .put("/user/updateProfile")
      .set("Authorization", token)
      .send({
        id: users[1].id,
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

    const other = await User.findById(users[1].id);
    expect(other?.firstname).toEqual(users[1].firstname);
  });

  it("Should find the account updated", async () => {
    const res = await request(app)
      .get(`/user/profile/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("firstname", "update");
    expect(res.body).toHaveProperty("lastname", "account");
    expect(res.body).toHaveProperty("gender", "Male");
    expect(res.body).toHaveProperty("dateOfBirth", "1995-10-30T00:00:00.000Z");
    expect(res.body).toHaveProperty("hometown", "New york");
    expect(res.body).toHaveProperty("worksAt", "Google");
    expect(res.body).toHaveProperty("school", "MIT");
    expect(res.body).toHaveProperty("relationship", "Single");
  });

  it("Should reject an invalid name", async () => {
    const res = await request(app)
      .put("/user/updateProfile")
      .set("Authorization", token)
      .send({ firstname: "<script>", lastname: "account" });
    expect(res.statusCode).toEqual(400);
  });
});

describe("DELETE /user/deleteAccount", () => {
  it("Should never delete the guest account", async () => {
    const guest = await User.create({
      firstname: "Guest",
      lastname: "Account",
      email: TEST_ACCOUNT_EMAIL,
    });
    const res = await request(app)
      .delete("/user/deleteAccount")
      .set("Authorization", tokenFor(guest.id));
    expect(res.statusCode).toEqual(403);
    expect(await User.exists({ _id: guest.id })).toBeTruthy();
  });

  it("Should delete the logged in account, whatever id the body says", async () => {
    const res = await request(app)
      .delete("/user/deleteAccount")
      .set("Authorization", token)
      .send({ id: users[1].id });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual("User deleted");
    expect(await User.exists({ _id: users[1].id })).toBeTruthy();
  });

  it("Should return 404 when GET the deleted user", async () => {
    const res = await request(app)
      .get(`/user/profile/${userId}`)
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("No user found");
  });
});

afterAll(async () => {
  await closeMongoServer();
});
