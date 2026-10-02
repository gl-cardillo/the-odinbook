import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  authorId: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  likes: { type: Array },
  picUrl: { type: String },
});

// feeds and profiles list posts by author, newest first
PostSchema.index({ authorId: 1, date: -1 });
PostSchema.index({ date: -1 });

PostSchema.set("toObject", { virtuals: true });
PostSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Post", PostSchema);
