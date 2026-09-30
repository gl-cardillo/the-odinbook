const mockSend = jest.fn(() => Promise.resolve({}));

jest.mock("@aws-sdk/client-s3", () => ({
  ...jest.requireActual("@aws-sdk/client-s3"),
  S3Client: jest.fn(() => ({ send: mockSend })),
}));

const { deleteFile } = require("../config/s3");

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
    expect(mockSend.mock.calls[0][0].input).toHaveProperty("Key", "abc123");
  });
});
