const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  likes: { type: Array },
  picUrl: {type: String}
});

PostSchema.set("toObject", { virtuals: true });
PostSchema.set("toJSON", { virtuals: true });

PostSchema.virtual("date_formatted").get(function () {
  return DateTime.fromJSDate(this.date).toRelativeCalendar();
});

module.exports = mongoose.model("Post", PostSchema);
