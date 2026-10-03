import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { SideMenu } from "../SideMenu/SideMenu";
import { getTime } from "../../utils/utils";
import { useNotifications } from "../../queries";

export function Notifications() {
  const { data } = useNotifications();

  return (
    <div className="main-page">
      <div className="containers">
        <h2>Notification</h2>
        <div className="notification-container">
          {!data ? (
            <Skeleton height={60} style={{ margin: "5px 0" }} count={4} />
          ) : data.notifications.length === 0 ? (
            <p>No notifications at the moment</p>
          ) : (
            data.notifications.map((notification) => (
              <Link
                to={notification.link}
                key={notification.id}
              >
                <div className="notification">
                  <div>
                    <img
                      src={notification.profilePicUrl}
                      className="avatar-pic"
                      alt="avatar"
                    />
                    <p className="notification-text">
                      {notification.fullname ?? "Deleted user"}{" "}
                      {notification.message}
                    </p>
                  </div>
                  <p className="time">{getTime(notification.date)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
