import { vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { signToken } from "../middleware/verifyToken.js";

// Authorization header for any user, to act as them in a test
export const tokenFor = (userId: string) => `Bearer ${signToken(userId)}`;

// a picture url inside the bucket
export const bucketUrl = (key: string) =>
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}`;

// keep the real url checks, never call the real bucket
let uploads = 0;
export const mockS3 = async (
  importOriginal: () => Promise<typeof import("../config/s3.js")>
) => ({
  ...(await importOriginal()),
  deleteFile: vi.fn(),
  createUploadForm: vi.fn(async (contentType: string) => {
    const key = `uploads/test-${++uploads}`;
    return {
      url: bucketUrl(""),
      fields: { key, "Content-Type": contentType },
      key,
    };
  }),
});

// asks for an upload as the given user, the url a post or picture can then use
export const uploadAs = async (app: Express, token: string) => {
  const res = await request(app)
    .post("/uploads")
    .send({ type: "image/png" })
    .set("Authorization", token);
  return res.body.fileUrl as string;
};
