import { SideMenu } from "../SideMenu/SideMenu";
import { useLocation } from "react-router";
import { getTime } from "../../utils/utils";
import type { Notification } from "../../types";

export function Notifications() {
  const location = useLocation();
  // the list comes from the navbar, it is missing when the page is opened directly
  const state = location.state as { notifications?: Notification[] } | null;
  const notifications = state?.notifications ?? [];

  return (
    <div className="main-page">
      <div className="containers">
        <h2>Notification</h2>
        <div className="notification-container">
          {notifications.map((notification, index) => {
            return (
              <div className="notification" key={index}>
                <div>
                  <img
                    src={notification.profilePicUrl}
                    className="avatar-pic"
                    alt="avatar"
                  />
                  <p className="notification-text">
                    {notification.fullname} {notification.message}
                  </p>
                </div>
                <p className="time">{getTime(notification.date)}</p>
              </div>
            );
          })}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
