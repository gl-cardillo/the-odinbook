import User from "../models/user.js";

interface NotificationContent {
  message: string;
  link: string;
  // the post the notification is about, used to clean up when it is deleted
  elementId?: string;
  // the comment or reply the notification is about
  commentId?: string;
  date?: number;
}

// nobody gets notified about their own actions
export const notify = async (
  toUserId: string,
  fromUserId: string,
  content: NotificationContent
) => {
  if (toUserId === fromUserId) return;
  await User.updateOne(
    { _id: toUserId },
    {
      $push: {
        notifications: {
          userId: fromUserId,
          date: Date.now(),
          seen: false,
          ...content,
        },
      },
    }
  );
};

export const removeNotifications = (
  userId: string,
  match: Record<string, unknown>
) => User.updateOne({ _id: userId }, { $pull: { notifications: match } });
