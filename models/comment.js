const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  authorId: { type: String, required: true },
  postId: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  likes: { type: Array },
});

CommentSchema.set("toObject", { virtuals: true });
CommentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Comment", CommentSchema);
