import { useState } from "react";
import { Link } from "react-router";
import { IoNotificationsOutline } from "react-icons/io5";
import { useNotifications, useNotificationsSeen } from "../../queries";
import { useDismiss } from "../ui";
import { NotificationItem } from "../Notifications/NotificationItem";
import styles from "./Navbar.module.scss";

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  // the ones new when the menu opened keep their dot after being marked seen
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const { data } = useNotifications();
  const markSeen = useNotificationsSeen();
  const notifications = data?.notifications ?? [];
  const unseen = data?.unseen ?? 0;

  const toggle = () => {
    if (!open) {
      setFresh(new Set(notifications.filter((n) => !n.seen).map((n) => n.id)));
      if (unseen > 0) markSeen.mutate();
    }
    setOpen(!open);
  };

  return (
    <div className={styles.menu} ref={ref}>
      <button
        className={styles.iconButton}
        onClick={toggle}
        aria-label={
          unseen > 0 ? `Notifications, ${unseen} new` : "Notifications"
        }
        aria-expanded={open}
        data-cy="notifications-button"
      >
        <IoNotificationsOutline />
        {unseen > 0 && (
          <span className={styles.badge} data-cy="notifications-badge">
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`${styles.panel} ${styles.alignEnd}`}
          data-cy="notifications-panel"
        >
          <h2 className={styles.panelTitle}>Notifications</h2>
          {notifications.length === 0 ? (
            <p className={styles.panelEmpty}>No notifications at the moment</p>
          ) : (
            <ul className={styles.list}>
              {notifications.slice(0, 6).map((notification) => (
                <li key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    isNew={!notification.seen || fresh.has(notification.id)}
                    onClick={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/notifications"
            className={styles.panelFooter}
            onClick={() => setOpen(false)}
          >
            See all
          </Link>
        </div>
      )}
    </div>
  );
}
