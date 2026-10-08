import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { IoNotificationsOutline } from "react-icons/io5";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { Card, EmptyState } from "../ui";
import { NotificationItem } from "./NotificationItem";
import { useNotifications, useNotificationsSeen } from "../../queries";
import styles from "./Notifications.module.scss";

export function Notifications() {
  const { data } = useNotifications();
  const { mutate: markSeen } = useNotificationsSeen();
  // the ones new when the page opened keep their dot after being marked seen
  const [fresh, setFresh] = useState<Set<string> | null>(null);

  if (data && fresh === null) {
    setFresh(
      new Set(data.notifications.filter((n) => !n.seen).map((n) => n.id))
    );
  }

  useEffect(() => {
    if (fresh && fresh.size > 0) markSeen();
  }, [fresh, markSeen]);

  return (
    <PageLayout title="Notifications" aside={<SideMenu />}>
      <Card title="Notifications">
        {!data ? (
          <Skeleton height={64} count={4} style={{ marginBottom: 8 }} />
        ) : data.notifications.length === 0 ? (
          <EmptyState
            icon={<IoNotificationsOutline />}
            title="No notifications at the moment"
          >
            Likes, comments and friend requests will show up here
          </EmptyState>
        ) : (
          <ul className={styles.list}>
            {data.notifications.map((notification) => (
              <li key={notification.id}>
                <NotificationItem
                  notification={notification}
                  isNew={
                    !notification.seen || Boolean(fresh?.has(notification.id))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageLayout>
  );
}
