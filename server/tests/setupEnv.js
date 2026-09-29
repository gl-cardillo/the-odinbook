require("dotenv").config();

// fallback so tests run without a .env file
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "test-secret";
