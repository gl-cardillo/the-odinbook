const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const { promisify } = require("util");
const randomBytes = promisify(crypto.randomBytes);

const s3 = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_S3_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_S3_ACCESS_KEY,
  },
  // keep checksum params out of the signed url, the browser upload cannot send them
  requestChecksumCalculation: "WHEN_REQUIRED",
});

exports.generateUploadURL = async () => {
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex");

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageName,
  };

  const uploadURL = await getSignedUrl(s3, new PutObjectCommand(params), {
    expiresIn: 60,
  });
  return uploadURL;
};

// default profile and cover pictures shared by all the users
const defaultKeys = [
  "6cfd21bd1531475c0d00f7cc8de66fcb",
  "9cb0e642e580fca30a47e3eda534d29c",
];

exports.deleteFile = (url) => {
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
