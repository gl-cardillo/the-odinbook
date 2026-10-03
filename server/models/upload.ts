import mongoose from "mongoose";

// an image uploaded to the bucket, used by a post or as a profile picture
// once claimed; unclaimed ones are deleted after a while
const UploadSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

UploadSchema.index({ userId: 1, used: 1, createdAt: 1 });

export default mongoose.model("Upload", UploadSchema);
