import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  authorId: { type: String, required: true },
  postId: { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 },
  date: { type: Date, default: Date.now },
  // ids of the users who liked the comment
  likes: { type: [String], default: [] },
});

CommentSchema.index({ postId: 1, date: 1 });
CommentSchema.index({ authorId: 1 });

CommentSchema.set("toObject", { virtuals: true });
CommentSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Comment", CommentSchema);
