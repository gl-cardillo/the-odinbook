import { vi } from "vitest";
import { signToken } from "../middleware/verifyToken.js";

// Authorization header for any user, to act as them in a test
export const tokenFor = (userId: string) => `Bearer ${signToken(userId)}`;

// a picture url inside the bucket the api accepts
export const bucketUrl = (key: string) =>
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}`;

// keep the real url checks, never call the real bucket
export const mockS3 = async (
  importOriginal: () => Promise<typeof import("../config/s3.js")>
) => ({
  ...(await importOriginal()),
  deleteFile: vi.fn(),
  generateUploadURL: vi.fn(async () => bucketUrl("signed-upload-url")),
});
