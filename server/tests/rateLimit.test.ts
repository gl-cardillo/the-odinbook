import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { initializeMongoServer, closeMongoServer } from "./mongoConfigTesting.js";

beforeAll(async () => {
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

afterAll(async () => {
  await closeMongoServer();
});
