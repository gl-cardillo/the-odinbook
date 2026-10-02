import "./navbar.css";
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
import { getTime, confirmDelete } from "../../utils/utils";
import {
  useDeleteAccount,
  useFriendRequests,
  useNotifications,
  useNotificationsSeen,
  useSearch,
} from "../../queries";

const GUEST_EMAIL = "test-account@example.com";

// the value once it stops changing for a moment, to search while typing
function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useCurrentUser();

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const { data: search = [] } = useSearch(useDebounced(query.trim(), 250));
  const { data: friendRequests = [] } = useFriendRequests();
  const { data: notificationsData } = useNotifications();
  const notifications = notificationsData?.notifications ?? [];
  const unchecked = notificationsData?.unchecked ?? [];
  const markSeen = useNotificationsSeen();
  const deleteAccount = useDeleteAccount();
  const isGuest = user.email === GUEST_EMAIL;

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
    navigate("/");
    logout();
  };

  const onDeleteAccount = async () => {
    setShowSettings(false);
    setShowSidebar(false);
    const confirmed = await confirmDelete(
      "Are you sure you want to delete your account? Your posts, comments and friends will be deleted too."
    );
    if (!confirmed) return;
    deleteAccount.mutate(undefined, { onSuccess: logoutUser });
  };

  const toggleNotifications = () => {
    if (unchecked.length > 0) {
      markSeen.mutate();
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
          {showSearch && query.trim().length > 0 && (
            <div className="search-result">
              {search.length > 0 ? (
                search.map((userSearch) => (
                  <Link
                    key={userSearch.id}
                    to={`/profile/${userSearch.id}`}
                    style={{ textDecoration: "none" }}
                    onClick={() => setQuery("")}
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
          <Link to={`/searchPage?q=${encodeURIComponent(query.trim())}`}>
            <IoSearch className="icon icon-search" />
          </Link>
        </div>
        <div className="icon-container">
          <div className="notification-icon-container" ref={notificationRef}>
            <IoNotificationsOutline
              onClick={toggleNotifications}
              className="icon notification-icon"
            />
            {unchecked.length > 0 && (
              <p className="notification-count">{unchecked.length}</p>
            )}
            {showNotification && (
              <div className="notifications-container">
                <h2 className="notification-title">Notifications</h2>
                {notifications.length > 0 ? (
                  <div>
                    {notifications.slice(0, 4).map((notification) => (
                      <Link
                        key={`${notification.userId}-${notification.date}`}
                        to={notification.link}
                      >
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
                              {notification.fullname ?? "Deleted user"}{" "}
                              {notification.message}
                            </p>
                          </div>
                          <p className="time">{getTime(notification.date)}</p>
                        </div>
                      </Link>
                    ))}
                    <Link to="/notifications">
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
                  isGuest ? "margin-50" : "margin-150"
                }`}
              >
                <div className="inner-settings-container" onClick={logoutUser}>
                  <FaSignOutAlt size={20} />
                  <p>Log out</p>
                </div>
                {!isGuest && (
                  <div className="inner-settings-container">
                    <MdDelete size={20} color="red" />
                    <p className="delete-text" onClick={onDeleteAccount}>
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
            {friendRequests.length > 0 && (
              <p className="request-count">{friendRequests.length}</p>
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
            {!isGuest && (
              <div className="inner-settings-container">
                <MdDelete size={24} color="red" />
                <p className="delete-text" onClick={onDeleteAccount}>
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
