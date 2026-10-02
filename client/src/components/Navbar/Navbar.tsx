import "./navbar.css";
import axios from "axios";
import { Link, useNavigate, Outlet } from "react-router";
import { useState, useRef, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import {
  IoSearch,
  IoHomeSharp,
  IoNotificationsOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { BsX } from "react-icons/bs";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import { FaSignOutAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import {
  getTime,
  swalStyle,
  handleError,
  errorMessage,
  setAuthToken,
} from "../../utils/utils";
import Swal from "sweetalert2";
import type {
  Notification,
  NotificationsResponse,
  UserSummary,
} from "../../types";

export function Navbar() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<UserSummary[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationUnchecked, setNotificationUnchecked] = useState<
    Notification[]
  >([]);
  const [showSettings, setShowSettings] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [friendRequestsLength, setFriendRequestsLength] = useState(0);

  const { user, setUser } = useCurrentUser();

  useEffect(() => {
    const getData = async () => {
      try {
        const [friendRequests, userNotifications] = await Promise.all([
            axios.get<UserSummary[]>(`/user/friendRequests/${user._id}`),
            axios.get<NotificationsResponse>(
              `/user/getNotification/${user.id}`
            ),
          ]);

        setFriendRequestsLength(friendRequests.data.length);
        setNotifications(userNotifications.data.notifications);
        setNotificationUnchecked(userNotifications.data.unchecked);
      } catch (err) {
        console.log(err);
        handleError(errorMessage(err));
      }
    };
    getData();
  }, [user._id, user.id]);

  // ask the server once the user stops typing for a moment
  useEffect(() => {
    if (query.trim() === "") {
      setSearch([]);
      return;
    }
    let ignore = false;
    const timer = setTimeout(() => {
      axios
        .get<UserSummary[]>(`/user/search`, { params: { q: query } })
        .then((res) => {
          if (!ignore) setSearch(res.data);
        })
        .catch((err) => console.log(err));
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setSearch([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotification(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logoutUser = () => {
    localStorage.clear();
    navigate("/");
    setUser(null);
    setAuthToken(null);
  };

  const deleteAccount = async () => {
    try {
      await axios.delete(`/user/deleteAccount`, {
        data: {
          id: user.id,
        },
      });
      localStorage.clear();
      setUser(null);
      navigate("/");
    } catch (err) {
      console.log(err);
      handleError(errorMessage(err));
    }
  };

  const confirmDeleteComment = () => {
    Swal.fire({
      title: "Are you sure you want to delete this comment?",
      position: "top",
      showCancelButton: true,
      confirmButtonText: "Close",
      cancelButtonText: "Delete",
      ...swalStyle,
    }).then((result) => {
      if (result.isDismissed) {
        deleteAccount();
        Swal.close();
      } else {
        Swal.close();
      }
    });
  };

  const handleNotification = async () => {
    if (notificationUnchecked.length > 0) {
      axios.put(`/user/checkNotification`, {
        id: user.id,
      });
      setNotificationUnchecked([]);
    }
    setShowNotification(!showNotification);
  };

  return (
    <div>
      <div className="navbar">
        <Link to={"/home"}>
          <h1 className="title-navbar">Odinbook</h1>
          <IoHomeSharp className="home-navbar" />
        </Link>
        <div
          className="search"
          // wait a moment so a click on a result still works
          onBlur={() => setTimeout(() => setShowSearch(false), 200)}
        >
          <input
            type="text"
            id="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
          />
          {showSearch && query.length > 0 && (
            <div className="search-result">
              {search.length > 0 ? (
                search.map((userSearch, index) => (
                  <Link
                    key={index}
                    to={`/profile/${userSearch.id}`}
                    style={{ textDecoration: "none" }}
                    onClick={clearSearch}
                  >
                    <div className="result-user">
                      <img
                        src={userSearch.profilePicUrl}
                        className="avatar-pic"
                        alt="avatar"
                      />

                      <p>{userSearch.fullname}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="no-user-found">No users found</p>
              )}
            </div>
          )}
          <Link to="/searchPage" state={{ search }}>
            <IoSearch className="icon icon-search" />
          </Link>
        </div>
        <div className="icon-container">
          <div className="notification-icon-container" ref={notificationRef}>
            <IoNotificationsOutline
              onClick={handleNotification}
              className="icon notification-icon"
            />
            {notificationUnchecked.length > 0 && (
              <p className="notification-count">
                {notificationUnchecked.length}
              </p>
            )}
            {showNotification && (
              <div className="notifications-container">
                <h2 className="notification-title">Notifications</h2>
                {notifications.length > 0 ? (
                  <div>
                    {notifications.slice(0, 4).map((notification, index) => (
                      <Link key={index} to={notification.link}>
                        <div
                          className={
                            notification.seen
                              ? "notification"
                              : "notification unseen"
                          }
                        >
                          <div>
                            <img
                              src={notification.profilePicUrl}
                              className="avatar-pic pic-30px"
                              alt="avatar"
                            />
                            <p className="notification-text">
                              {notification.fullname} {notification.message}
                            </p>
                          </div>
                          <p className="time">{getTime(notification.date)}</p>
                        </div>
                      </Link>
                    ))}
                    <Link to="/notifications" state={{ notifications }}>
                      <p
                        className="see-more see-more-notification"
                        onClick={() => setShowNotification(false)}
                      >
                        See more..
                      </p>
                    </Link>
                  </div>
                ) : (
                  <p>No notifications at the moment</p>
                )}
              </div>
            )}
          </div>
          <div className="settings" ref={settingsRef}>
            <IoSettingsOutline
              onClick={() => setShowSettings(!showSettings)}
              className="icon notification-icon"
            />
            {showSettings && (
              <div
                className={`settings-container ${
                  user.email !== "test-account@example.com"
                    ? "margin-150"
                    : "margin-50"
                }`}
              >
                <div className="inner-settings-container" onClick={logoutUser}>
                  <FaSignOutAlt size={20} />
                  <p>Log out</p>
                </div>
                {user.email !== "test-account@example.com" && (
                  <div className="inner-settings-container">
                    <MdDelete size={20} color="red" />
                    <p className="delete-text" onClick={confirmDeleteComment}>
                      Delete account
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="navbar-buttons">
          <Link to="/friendRequests" className="icon icon-friend">
            {friendRequestsLength > 0 && (
              <p className="request-count">{friendRequestsLength}</p>
            )}
            <FiUserPlus />
          </Link>
          <Link to="/friends" className="icon icon-friend">
            <FiUsers />
          </Link>
          <img
            src={user.profilePicUrl}
            alt="profile button"
            role="button"
            className="avatar-pic pic-30px"
            onClick={() => setShowSidebar(!showSidebar)}
          />
          <div className={showSidebar ? "sidebar sidebar-open" : "sidebar"}>
            <BsX className="closebtn" onClick={() => setShowSidebar(false)} />
            <Link
              onClick={() => setShowSidebar(false)}
              to={`/profile/${user._id}`}
            >
              <img
                src={user.profilePicUrl}
                alt="avatar"
                className="avatar-pic pic-30px"
              />
              &nbsp;Profile
            </Link>
            <div className="inner-settings-container" onClick={logoutUser}>
              <FaSignOutAlt size={24} /> <p>Log out</p>
            </div>
            {user.email !== "test-account@example.com" && (
              <div className="inner-settings-container">
                <MdDelete size={24} color="red" />
                <p className="delete-text" onClick={() => deleteAccount()}>
                  Delete account
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
