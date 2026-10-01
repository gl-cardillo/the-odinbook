import "../config/env.js";

// fallbacks so tests run without a .env file
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "test-secret";
process.env.AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || "test-bucket";
process.env.AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION || "eu-west-2";
