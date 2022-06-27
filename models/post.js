const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  authorId: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  likes: { type: Array },
  picUrl: {type: String}
});

PostSchema.set("toObject", { virtuals: true });
PostSchema.set("toJSON", { virtuals: true });


module.exports = mongoose.model("Post", PostSchema);
