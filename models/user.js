const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  profilePicUrl: { type: String },
  coverPicUrl: { type: String },
  friends: { type: Array },
  friendRequests: { type: Array },
  gender: { type: String },
  hometown: { type: String },
  dateOfbirth: { type: Date },
  worksAt: { type: Date },
  relantionship: { type: String },
});

UserSchema.set("toObject", { virtuals: true });
UserSchema.set("toJSON", { virtuals: true });

UserSchema.virtual("fullname").get(function () {
  return this.firstname + " " + this.lastname;
});

UserSchema.plugin(findOrCreate);

module.exports = mongoose.model("User", UserSchema);
