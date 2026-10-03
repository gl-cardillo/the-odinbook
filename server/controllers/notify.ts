import Notification from "../models/notification.js";
import type { NotificationType } from "../models/notification.js";
import { findUserSummaries } from "./details.js";

const MESSAGES: Record<NotificationType, string> = {
  friend_request: "sent you a friend request",
  friend_accept: "accepted your friend request",
  post_like: "liked your post",
  post_comment: "commented your post",
  comment_like: "liked your comment",
  comment_reply: "replied to your comment",
};

// one of these at a time per user and target, liking twice is still one
const SINGLE: NotificationType[] = ["friend_request", "post_like", "comment_like"];

interface About {
  postId?: string;
  commentId?: string;
  replyId?: string;
}

// nobody gets notified about their own actions
export const notify = async (
  recipientId: string,
  actorId: string,
  type: NotificationType,
  about: About = {}
) => {
  if (recipientId === actorId) return;
  if (SINGLE.includes(type)) {
    await Notification.findOneAndUpdate(
      { recipientId, actorId, type, ...about },
      { seen: false, createdAt: new Date() },
      { upsert: true }
    );
    return;
  }
  await Notification.create({ recipientId, actorId, type, ...about });
};

export const removeNotifications = (filter: Record<string, unknown>) =>
  Notification.deleteMany(filter);

type NotificationDoc = InstanceType<typeof Notification>;

const linkFor = (notification: NotificationDoc) => {
  switch (notification.type) {
    case "friend_request":
      return "/friendRequests";
    case "friend_accept":
      return `/profile/${notification.actorId}`;
    default:
      return `/singlePost/${notification.postId}`;
  }
};

// the latest notifications of a user, ready to show
export const listNotifications = async (recipientId: string, limit = 50) => {
  const [notifications, unseen] = await Promise.all([
    Notification.find({ recipientId }).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ recipientId, seen: false }),
  ]);
  const actors = await findUserSummaries(notifications.map((n) => n.actorId));

  return {
    notifications: notifications.map((notification) => {
      const actor = actors.get(notification.actorId);
      return {
        id: notification.id,
        type: notification.type,
        userId: notification.actorId,
        // kept empty if the account was deleted
        fullname: actor?.fullname,
        profilePicUrl: actor?.profilePicUrl,
        message: MESSAGES[notification.type],
        link: linkFor(notification),
        postId: notification.postId,
        seen: notification.seen,
        date: notification.createdAt,
      };
    }),
    unseen,
  };
};
