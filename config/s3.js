require("dotenv").config();
const aws = require("aws-sdk");
const crypto = require("crypto");
const { promisify } = require("util");
const randomBytes = promisify(crypto.randomBytes);
const multer = require("multer");
const path = require("path");



const s3 = new aws.S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sifnatureVersion: "v4",
});

exports.generateUploadURL = async () => {
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex");

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageName ,
    Expires: 60,
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", params);
  console.log(uploadURL);
  return uploadURL;
};

exports.deleteFile = (url) => {
  //get key from url
  const key = url.split("amazonaws.com/")[1];

  if (key === "6cfd21bd1531475c0d00f7cc8de66fcb") {
    return;
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  s3.deleteObject(params, function (err, data) {
    if (err) console.log(err, err.stack);
    else console.log(data);
  });
};
