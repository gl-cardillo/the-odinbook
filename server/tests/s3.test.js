const mockDeleteObject = jest.fn();

jest.mock("aws-sdk", () => ({
  S3: jest.fn(() => ({ deleteObject: mockDeleteObject })),
}));

const { deleteFile } = require("../config/s3");

const bucketUrl = "https://my-odin-bucket.s3.eu-west-2.amazonaws.com";

beforeEach(() => {
  mockDeleteObject.mockClear();
});

describe("deleteFile", () => {
  it("Should not delete the default profile and cover pictures", () => {
    deleteFile(`${bucketUrl}/6cfd21bd1531475c0d00f7cc8de66fcb.png`);
    deleteFile(`${bucketUrl}/9cb0e642e580fca30a47e3eda534d29c.png`);
    deleteFile(`${bucketUrl}/6cfd21bd1531475c0d00f7cc8de66fcb`);
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });

  it("Should ignore an empty or invalid url", () => {
    deleteFile(undefined);
    deleteFile("");
    deleteFile("www.urlExample.com");
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });

  it("Should delete a picture uploaded by a user", () => {
    deleteFile(`${bucketUrl}/abc123`);
    expect(mockDeleteObject).toHaveBeenCalledTimes(1);
    expect(mockDeleteObject.mock.calls[0][0]).toHaveProperty("Key", "abc123");
  });
});
