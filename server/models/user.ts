import mongoose from "mongoose";
import { DateTime } from "luxon";

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstname: { type: String, minLength: 2, maxlength: 15, required: true },
    lastname: { type: String, minLength: 2, maxlength: 15, required: true },
    email: { type: String, required: true, unique: true },
    // never loaded unless asked for with .select("+password")
    password: { type: String, select: false },
    profilePicUrl: { type: String },
    coverPicUrl: { type: String },
    friends: { type: [String] },
    friendRequests: { type: [String] },
    notifications: { type: Array },
    gender: { type: String },
    hometown: { type: String },
    dateOfBirth: { type: Date },
    worksAt: { type: String },
    school: { type: String },
    relationship: { type: String },
  },
  {
    toObject: { virtuals: true },
    toJSON: {
      virtuals: true,
      // the hash must never reach a response or a token
      transform(_doc, ret) {
        const data = ret as Record<string, unknown>;
        delete data.password;
        // notifications have their own endpoint, only for their owner
        delete data.notifications;
        return ret;
      },
    },
    virtuals: {
      fullname: {
        get() {
          return this.firstname + " " + this.lastname;
        },
      },
      dateOfBirth_formatted: {
        get() {
          return DateTime.fromJSDate(this.dateOfBirth as Date).toLocaleString(
            DateTime.DATE_SHORT
          );
        },
      },
      dateOfBirth_toISODate: {
        get() {
          return DateTime.fromJSDate(this.dateOfBirth as Date).toISODate();
        },
      },
    },
  }
);

export default mongoose.model("User", UserSchema);
