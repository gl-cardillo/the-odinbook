import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

mongoose.connect(uri);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
