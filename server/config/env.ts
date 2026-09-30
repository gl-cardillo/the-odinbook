import dotenv from "dotenv";

// imported first so every module sees the variables from .env
dotenv.config({ quiet: true });

export const accessTokenSecret = () => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is not set");
  }
  return secret;
};
