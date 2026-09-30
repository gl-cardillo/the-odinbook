import { describe, it, expect, beforeEach, vi } from "vitest";
import { deleteFile } from "../config/s3.js";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn((_command: unknown) => Promise.resolve({})),
}));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@aws-sdk/client-s3")>()),
  S3Client: vi.fn(function () {
    return { send: mockSend };
  }),
}));

const bucketUrl = "https://my-odin-bucket.s3.eu-west-2.amazonaws.com";

beforeEach(() => {
  mockSend.mockClear();
});

describe("deleteFile", () => {
  it("Should not delete the default profile and cover pictures", () => {
    deleteFile(`${bucketUrl}/6cfd21bd1531475c0d00f7cc8de66fcb.png`);
    deleteFile(`${bucketUrl}/9cb0e642e580fca30a47e3eda534d29c.png`);
    deleteFile(`${bucketUrl}/6cfd21bd1531475c0d00f7cc8de66fcb`);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("Should ignore an empty or invalid url", () => {
    deleteFile(undefined);
    deleteFile("");
    deleteFile("www.urlExample.com");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("Should delete a picture uploaded by a user", () => {
    deleteFile(`${bucketUrl}/abc123`);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const command = mockSend.mock.calls[0][0] as { input: { Key: string } };
    expect(command.input).toHaveProperty("Key", "abc123");
  });
});
