import mongoose from "mongoose";

import { NOTIFICATION_TYPES } from "@odinbook/shared";

// something another user did that concerns the recipient
const NotificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true },
  actorId: { type: String, required: true },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  // what it is about, used for the link and to clean up on delete
  postId: { type: String },
  commentId: { type: String },
  replyId: { type: String },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// the latest notifications of a user
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ postId: 1 });
NotificationSchema.index({ commentId: 1 });
NotificationSchema.index({ actorId: 1 });

export default mongoose.model("Notification", NotificationSchema);
