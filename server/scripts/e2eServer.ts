// The API on a fresh in-memory database, for the Cypress tests of the client.
// Fake secrets and bucket, set before anything loads .env (dotenv never
// overrides), so the tests never touch real data or the real bucket.
//
//   npm run e2e:server   -> http://localhost:5050

process.env.ACCESS_TOKEN_SECRET = "e2e-secret";
process.env.TEST_PASSWORD = "guest-password";
process.env.AWS_BUCKET_NAME = "e2e-fake-bucket";
process.env.AWS_BUCKET_REGION = "eu-west-2";
process.env.AWS_ACCESS_S3_KEY_ID = "AKIAFAKEFAKEFAKEFAKE";
process.env.AWS_SECRET_S3_ACCESS_KEY = "fake-secret";
// the tests sign up and act many times in a row from the same machine
process.env.AUTH_RATE_LIMIT = "100000";
process.env.WRITE_RATE_LIMIT = "100000";
process.env.UPLOAD_RATE_LIMIT = "100000";
delete process.env.CLIENT_URL;

const { MongoMemoryServer } = await import("mongodb-memory-server");
const { default: mongoose } = await import("mongoose");

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
const { default: app } = await import("../app.js");

const port = Number(process.env.E2E_PORT) || 5050;
const server = app.listen(port, () =>
  console.log(`E2E API ready on http://localhost:${port}`)
);

const stop = async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
