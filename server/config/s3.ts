import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "node:crypto";
import { MAX_IMAGE_BYTES } from "@odinbook/shared";

const s3 = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_S3_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_S3_ACCESS_KEY ?? "",
  },
});

const bucketUrl = () =>
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`;

// where a file in the bucket can be read
export const fileUrl = (key: string) => bucketUrl() + key;

// the key of a file in our bucket, undefined for any other url
export const keyFromUrl = (url: unknown) =>
  typeof url === "string" && url.startsWith(bucketUrl())
    ? url.slice(bucketUrl().length)
    : undefined;

// a form the browser posts the image with; S3 itself rejects a file
// over the size limit or of another type than the one signed here
export const createUploadForm = async (contentType: string) => {
  const key = `uploads/${crypto.randomBytes(16).toString("hex")}`;
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: process.env.AWS_BUCKET_NAME ?? "",
    Key: key,
    Conditions: [
      ["content-length-range", 1, MAX_IMAGE_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 60,
  });
  return { url, fields, key };
};

// default profile and cover pictures shared by all the users
const defaultKeys = [
  "6cfd21bd1531475c0d00f7cc8de66fcb",
  "9cb0e642e580fca30a47e3eda534d29c",
];

export const deleteFile = (url?: string | null) => {
  if (!url) return;
  //get key from url
  const key = url.split("amazonaws.com/")[1];
  if (!key) return;

  //never delete the default pictures (the key can have an extension)
  if (defaultKeys.includes(key.split(".")[0])) {
    return;
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  s3.send(new DeleteObjectCommand(params)).catch((err) =>
    console.log(err, err.stack)
  );
};
