import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  authorId: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  likes: { type: Array },
  picUrl: { type: String },
});

PostSchema.set("toObject", { virtuals: true });
PostSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Post", PostSchema);
