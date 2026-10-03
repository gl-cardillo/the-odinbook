import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  authorId: { type: String, required: true },
  postId: { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 },
  date: { type: Date, default: Date.now },
  reply: { type: Array, default: [] },
  likes: { type: Array },
});

CommentSchema.index({ postId: 1 });

CommentSchema.set("toObject", { virtuals: true });
CommentSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Comment", CommentSchema);
