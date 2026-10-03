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
    // ids of the users
    friends: { type: [String], default: [] },
    // ids of the users who asked this user for friendship
    friendRequests: { type: [String], default: [] },
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
        // left over in old documents, notifications are a collection now
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
