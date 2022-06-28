import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { SideMenu } from "../SideMenu/SideMenu";
import { useLocation } from "react-router-dom";
import { handleSearch, blur, getTime } from "../../utils/utils";

export function Notifications() {
  const data = useLocation();
  const notifications = data.state.notifications;

  return (
    <div className="main-page">
      <div className="containers">
        <h2>Notifications</h2>
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
