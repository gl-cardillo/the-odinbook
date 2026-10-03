import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/user.js";
import { TEST_ACCOUNT_EMAIL } from "../config/env.js";
import { initializeMongoServer, closeMongoServer } from "./mongoConfigTesting.js";
import { seed } from "./seed.js";
import Upload from "../models/upload.js";
import { tokenFor, uploadAs } from "./helpers.js";

vi.mock("../config/s3.js", async (importOriginal) =>
  (await import("./helpers.js")).mockS3(importOriginal)
);

let token: string;
let userId: string;
// the 6 users created by the seed
let users: InstanceType<typeof User>[];

const signupData = {
  firstname: "Luca",
  lastname: "Cardi",
  email: "lucacardi@gmail.com",
  password: "password123",
};

beforeAll(async () => {
  await initializeMongoServer();
  await seed();
});

describe("POST /auth/signup", () => {
  it("Should create a new user", async () => {
    const res = await request(app).post("/auth/signup").send(signupData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("firstname", "Luca");
    expect(res.body.user).toHaveProperty("lastname", "Cardi");
    expect(res.body.user).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body.user).toHaveProperty("fullname", "Luca Cardi");
    expect(res.body.user).toHaveProperty("profilePicUrl");
    expect(res.body.user).toHaveProperty("friends", []);
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("notifications");

    users = await User.find({ _id: { $ne: res.body.user.id } });
  });

  it("Should reject an invalid email", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...signupData, email: "not-an-email" });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("A valid email is required");
  });

  it("Should reject an email already used", async () => {
    const res = await request(app).post("/auth/signup").send(signupData);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("User already exists");
  });
});

describe("POST /auth/login", () => {
  it("Should login successfully", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: signupData.email, password: signupData.password });
    expect(res.statusCode).toEqual(200);
    expect(res.body.user).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body.user).not.toHaveProperty("password");

    userId = res.body.user.id;
    token = `Bearer ${res.body.token}`;
  });

  it("Should give the same answer for a wrong password and an unknown email", async () => {
    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: signupData.email, password: "wrong-password1" });
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
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${oldToken}`);
    expect(res.statusCode).toEqual(401);
  });

  it("Should keep the password hashed in the database", async () => {
    const saved = await User.findById(userId).select("+password");
    expect(saved?.password).toMatch(/^\$2[aby]\$/);
  });
});

describe("Errors", () => {
  it("Should answer 400 for an invalid id", async () => {
    const res = await request(app)
      .get("/users/not-an-id")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Invalid userId");
  });

  it("Should answer 404 in json for an unknown route", async () => {
    const res = await request(app).get("/nothing-here");
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("Route not found");
  });

  it("Should answer 400 for a malformed json body", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{ not json");
    expect(res.statusCode).toEqual(400);
  });
});

describe("GET /users/:userId", () => {
  it("Should need a login", async () => {
    const res = await request(app).get(`/users/${userId}`);
    expect(res.statusCode).toEqual(401);
  });

  it("Should return your own profile with the email", async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("id", userId);
    expect(res.body).toHaveProperty("email", "lucacardi@gmail.com");
    expect(res.body).not.toHaveProperty("password");
  });

  it("Should hide the email of other users", async () => {
    const res = await request(app)
      .get(`/users/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("fullname", users[0].fullname);
    expect(res.body).not.toHaveProperty("email");
    expect(res.body).not.toHaveProperty("notifications");
  });

  it("Should answer 404 for a user that does not exist", async () => {
    const res = await request(app)
      .get("/users/000000000000000000000000")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("User not found");
  });
});

describe("GET /users/me/suggestions", () => {
  it("Should return the profiles that are not friend with the user", async () => {
    const res = await request(app)
      .get("/users/me/suggestions")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(6);
    expect(res.body[0]).toHaveProperty("fullname");
    expect(res.body[0]).not.toHaveProperty("email");
  });

  it("Should respect the limit", async () => {
    const res = await request(app)
      .get("/users/me/suggestions?limit=3")
      .set("Authorization", token);
    expect(res.body.length).toEqual(3);
  });
});

describe("Friend requests", () => {
  it("Should send a request as the logged in user", async () => {
    const res = await request(app)
      .post(`/users/${users[0].id}/friend-request`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(204);
    const receiver = await User.findById(users[0].id);
    expect(receiver?.friendRequests).toEqual([userId]);
  });

  it("Should return request is pending if asked twice", async () => {
    const res = await request(app)
      .post(`/users/${users[0].id}/friend-request`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Request already pending");
  });

  it("Shouldn't allow to ask the request to themself", async () => {
    const res = await request(app)
      .post(`/users/${userId}/friend-request`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual(
      "User can send request only to other user"
    );
  });

  it("Should list the requests received, with a notification", async () => {
    const asReceiver = tokenFor(users[0].id);
    const requests = await request(app)
      .get("/users/me/friend-requests")
      .set("Authorization", asReceiver);
    expect(requests.statusCode).toEqual(200);
    expect(requests.body[0]).toEqual({
      id: userId,
      fullname: "Luca Cardi",
      profilePicUrl: expect.any(String),
    });

    const notifications = await request(app)
      .get("/users/me/notifications")
      .set("Authorization", asReceiver);
    expect(notifications.body.notifications[0].message).toEqual(
      "sent you a friend request"
    );
  });

  it("Should take back a sent request, and its notification", async () => {
    const res = await request(app)
      .delete(`/users/${users[0].id}/friend-request`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(204);
    const receiver = await User.findById(users[0].id);
    expect(receiver?.friendRequests).toEqual([]);
    expect(receiver?.notifications).toEqual([]);
  });

  it("Should not accept a request that was never sent", async () => {
    const res = await request(app)
      .post(`/users/me/friend-requests/${users[1].id}/accept`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("No request to accept");
  });

  it("Should accept a request as the user who received it", async () => {
    await request(app)
      .post(`/users/${users[0].id}/friend-request`)
      .set("Authorization", token);
    const res = await request(app)
      .post(`/users/me/friend-requests/${userId}/accept`)
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(204);

    const [me, friend] = await Promise.all([
      User.findById(userId),
      User.findById(users[0].id),
    ]);
    expect(me?.friends).toEqual([users[0].id]);
    expect(friend?.friends).toEqual([userId]);
    expect(friend?.friendRequests).toEqual([]);
  });

  it("Should list the friends of a user", async () => {
    const res = await request(app)
      .get(`/users/${userId}/friends`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].id).toEqual(users[0].id);
  });

  it("Should remove the friendship on both sides", async () => {
    const res = await request(app)
      .delete(`/users/me/friends/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(204);
    const friend = await User.findById(users[0].id);
    expect(friend?.friends).toEqual([]);

    const again = await request(app)
      .delete(`/users/me/friends/${users[0].id}`)
      .set("Authorization", token);
    expect(again.statusCode).toEqual(404);
  });

  it("Should decline a request", async () => {
    await request(app)
      .post(`/users/${userId}/friend-request`)
      .set("Authorization", tokenFor(users[0].id));
    const res = await request(app)
      .delete(`/users/me/friend-requests/${users[0].id}`)
      .set("Authorization", token);
    expect(res.statusCode).toEqual(204);

    const again = await request(app)
      .delete(`/users/me/friend-requests/${users[0].id}`)
      .set("Authorization", token);
    expect(again.statusCode).toEqual(400);
    expect(again.body.message).toEqual("No request to decline");
  });
});

describe("Notifications", () => {
  it("Should mark all your notifications as seen", async () => {
    await request(app)
      .post(`/users/${userId}/friend-request`)
      .set("Authorization", tokenFor(users[2].id));
    const res = await request(app)
      .post("/users/me/notifications/seen")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(204);

    const after = await request(app)
      .get("/users/me/notifications")
      .set("Authorization", token);
    expect(after.body.notifications.length).toBeGreaterThan(0);
    expect(after.body.unchecked).toEqual([]);
  });
});

describe("POST /uploads", () => {
  it("Should only sign uploads of images", async () => {
    const pdf = await request(app)
      .post("/uploads")
      .send({ type: "application/pdf" })
      .set("Authorization", token);
    expect(pdf.statusCode).toEqual(400);

    const png = await request(app)
      .post("/uploads")
      .send({ type: "image/png" })
      .set("Authorization", token);
    expect(png.statusCode).toEqual(201);
    expect(png.body).toHaveProperty("url");
    expect(png.body.fields).toHaveProperty("Content-Type", "image/png");
    expect(png.body).toHaveProperty("fileUrl");
    expect(png.body.maxBytes).toEqual(5 * 1024 * 1024);
  });

  it("Should clean up uploads never used after an hour", async () => {
    const stale = await uploadAs(app, token);
    const key = stale.split("amazonaws.com/")[1];
    await Upload.updateOne(
      { key },
      { createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
    );
    await uploadAs(app, token);
    expect(await Upload.exists({ key })).toBeFalsy();
  });
});

describe("PUT /users/me/picture", () => {
  it("Should refuse a picture outside the bucket", async () => {
    const res = await request(app)
      .put("/users/me/picture")
      .send({ kind: "profile", url: "https://example.com/picture.png" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Invalid picture url");
  });

  it("Should refuse a picture uploaded by someone else", async () => {
    const theirs = await uploadAs(app, tokenFor(users[1].id));
    const res = await request(app)
      .put("/users/me/picture")
      .send({ kind: "profile", url: theirs })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(400);
  });

  it("Should change the profile picture, once per upload", async () => {
    const url = await uploadAs(app, token);
    const res = await request(app)
      .put("/users/me/picture")
      .send({ kind: "profile", url })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body.profilePicUrl).toEqual(url);

    const again = await request(app)
      .put("/users/me/picture")
      .send({ kind: "cover", url })
      .set("Authorization", token);
    expect(again.statusCode).toEqual(400);
  });
});

describe("PATCH /users/me", () => {
  it("Should update the logged in account and return it", async () => {
    const res = await request(app)
      .patch("/users/me")
      .set("Authorization", token)
      .send({
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
    expect(res.body).toHaveProperty("firstname", "update");
    expect(res.body).toHaveProperty("dateOfBirth", "1995-10-30T00:00:00.000Z");
    expect(res.body).toHaveProperty("hometown", "New york");
    expect(res.body).toHaveProperty("relationship", "Single");
  });

  it("Should reject an invalid name", async () => {
    const res = await request(app)
      .patch("/users/me")
      .set("Authorization", token)
      .send({ firstname: "<script>", lastname: "account" });
    expect(res.statusCode).toEqual(400);
  });
});

describe("GET /users/search", () => {
  it("Should find users by first or last name, ignoring case", async () => {
    const target = users[2];
    const res = await request(app)
      .get("/users/search")
      .query({ q: target.lastname.toUpperCase() })
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(200);
    expect(res.body.find((u: { id: string }) => u.id === target.id)).toEqual({
      id: target.id,
      fullname: target.fullname,
      profilePicUrl: expect.any(String),
    });
  });

  it("Should treat the text literally and return nothing for no match", async () => {
    const res = await request(app)
      .get("/users/search")
      .query({ q: ".*" })
      .set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });
});

describe("DELETE /users/me", () => {
  it("Should never delete the guest account", async () => {
    const guest = await User.create({
      firstname: "Guest",
      lastname: "Account",
      email: TEST_ACCOUNT_EMAIL,
    });
    const res = await request(app)
      .delete("/users/me")
      .set("Authorization", tokenFor(guest.id));
    expect(res.statusCode).toEqual(403);
    expect(await User.exists({ _id: guest.id })).toBeTruthy();
  });

  it("Should delete the logged in account and its traces", async () => {
    await request(app)
      .post(`/users/${users[3].id}/friend-request`)
      .set("Authorization", token);

    const res = await request(app)
      .delete("/users/me")
      .set("Authorization", token);
    expect(res.statusCode).toEqual(204);
    expect(await User.exists({ _id: userId })).toBeFalsy();

    const other = await User.findById(users[3].id);
    expect(other?.friendRequests).not.toContain(userId);
    expect(other?.notifications).toEqual([]);
  });

  it("Should return 404 when GET the deleted user", async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", tokenFor(users[0].id));
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual("User not found");
  });
});

afterAll(async () => {
  await closeMongoServer();
});
