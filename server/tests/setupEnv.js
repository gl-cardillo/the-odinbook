require("dotenv").config({ quiet: true });

// fallback so tests run without a .env file
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "test-secret";
