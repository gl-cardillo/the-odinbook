import type { ReactNode } from "react";
import { Link } from "react-router";
import { AiFillLike } from "react-icons/ai";
import { FaComment, FaUserCheck, FaUserPlus } from "react-icons/fa";
import { Avatar, RelativeTime } from "../ui";
import type { Notification, NotificationType } from "../../types";
import styles from "./NotificationItem.module.scss";

const icons: Record<NotificationType, { icon: ReactNode; color: string }> = {
  friend_request: { icon: <FaUserPlus />, color: styles.blue },
  friend_accept: { icon: <FaUserCheck />, color: styles.blue },
  post_like: { icon: <AiFillLike />, color: styles.blue },
  comment_like: { icon: <AiFillLike />, color: styles.blue },
  post_comment: { icon: <FaComment />, color: styles.green },
  comment_reply: { icon: <FaComment />, color: styles.green },
};

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  isNew?: boolean;
}

export function NotificationItem({
  notification,
  onClick,
  isNew = !notification.seen,
}: NotificationItemProps) {
  const { icon, color } = icons[notification.type];

  return (
    <Link
      to={notification.link}
      className={styles.item}
      onClick={onClick}
      data-cy="notification"
    >
      <span className={styles.avatar}>
        <Avatar
          src={notification.profilePicUrl}
          name={notification.fullname ?? ""}
          size="lg"
          alt=""
        />
        <span className={`${styles.type} ${color}`} aria-hidden>
          {icon}
        </span>
      </span>
      <span className={styles.body}>
        <span className={styles.text}>
          <strong>{notification.fullname ?? "Deleted user"}</strong>{" "}
          {notification.message}
        </span>
        <RelativeTime
          date={notification.date}
          className={`${styles.time} ${isNew ? styles.new : ""}`}
        />
      </span>
      {isNew && (
        <span className={styles.unseenDot} role="img" aria-label="new" />
      )}
    </Link>
  );
}
