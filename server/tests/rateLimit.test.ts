import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import {
  initializeMongoServer,
  closeMongoServer,
} from "./mongoConfigTesting.js";
import { tokenFor } from "./helpers.js";

vi.mock("../config/s3.js", async (importOriginal) =>
  (await import("./helpers.js")).mockS3(importOriginal)
);

let app: Express;

beforeAll(async () => {
  // small limits for this file only, the app reads them when it loads
  process.env.WRITE_RATE_LIMIT = "5";
  process.env.UPLOAD_RATE_LIMIT = "3";
  app = (await import("../app.js")).default;
  await initializeMongoServer();
});

describe("POST /auth/login", () => {
  it("Should block an ip after 20 attempts in 15 minutes", async () => {
    const attempt = () =>
      request(app)
        .post("/auth/login")
        .send({ email: "nobody@example.com", password: "guess" });

    for (let i = 0; i < 20; i++) {
      const res = await attempt();
      expect(res.statusCode).toEqual(400);
    }
    const blocked = await attempt();
    expect(blocked.statusCode).toEqual(429);
  });
});

describe("Writes", () => {
  it("Should block a user after too many actions, not other users", async () => {
    const spammer = tokenFor("64b000000000000000000001");
    const write = (token: string) =>
      request(app)
        .post("/posts")
        .send({ text: "" })
        .set("Authorization", token);

    for (let i = 0; i < 5; i++) {
      expect((await write(spammer)).statusCode).toEqual(400);
    }
    const blocked = await write(spammer);
    expect(blocked.statusCode).toEqual(429);
    expect(blocked.body.message).toEqual(
      "Too many actions, please try again later"
    );

    const someoneElse = await write(tokenFor("64b000000000000000000002"));
    expect(someoneElse.statusCode).toEqual(400);
  });

  it("Should not limit reading", async () => {
    const reader = tokenFor("64b000000000000000000001");
    const res = await request(app).get("/posts").set("Authorization", reader);
    expect(res.statusCode).toEqual(200);
  });
});

describe("Uploads", () => {
  it("Should allow only a few uploads per hour", async () => {
    const uploader = tokenFor("64b000000000000000000003");
    const upload = () =>
      request(app)
        .post("/uploads")
        .send({ type: "image/png" })
        .set("Authorization", uploader);

    for (let i = 0; i < 3; i++) {
      expect((await upload()).statusCode).toEqual(201);
    }
    expect((await upload()).statusCode).toEqual(429);
  });
});

afterAll(async () => {
  await closeMongoServer();
});
