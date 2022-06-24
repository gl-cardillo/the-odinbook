const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstname: { type: String, minLength: 2, maxlength: 15, required: true },
  lastname: { type: String, minLength: 2, maxlength: 15, required: true },
  email: { type: String, required: true },
  password: { type: String },
  profilePicUrl: { type: String },
  coverPicUrl: { type: String },
  friends: { type: Array },
  friendRequests: { type: Array },
  gender: { type: String },
  hometown: { type: String },
  dateOfBirth: { type: Date },
  worksAt: { type: String },
  school: { type: String },
  relationship: { type: String },

});

UserSchema.set("toObject", { virtuals: true });
UserSchema.set("toJSON", { virtuals: true });

UserSchema.virtual("fullname").get(function () {
  return this.firstname + " " + this.lastname;
});

UserSchema.virtual("dateOfBirth_formatted").get(function () {
  return DateTime.fromJSDate(this.dateOfBirth).toLocaleString(
    DateTime.DATE_SHORT
  );
});

UserSchema.virtual("dateOfBirth_toISODate").get(function () {
  return DateTime.fromJSDate(this.dateOfBirth).toISODate(

  );
});


UserSchema.plugin(findOrCreate);

module.exports = mongoose.model("User", UserSchema);
