import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema({
  commentId: { type: String, required: true },
  // the post of the comment, so deleting a post removes its replies at once
  postId: { type: String, required: true },
  authorId: { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 },
  date: { type: Date, default: Date.now },
});

ReplySchema.index({ commentId: 1, date: 1 });
ReplySchema.index({ postId: 1 });
ReplySchema.index({ authorId: 1 });

ReplySchema.set("toJSON", { virtuals: true, versionKey: false });

export default mongoose.model("Reply", ReplySchema);
