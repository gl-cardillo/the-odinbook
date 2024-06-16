import "./navbar.css";
import axios from "axios";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useState, useRef, useContext, useEffect } from "react";
import { UserContext } from "../../dataContext/dataContext";
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
import { handleSearch, blur, getTime } from "../../utils/utils";

export function Navbar() {
  let navigate = useNavigate();

  const [search, setSearch] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationUnchecked, setNotificationUnchecked] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [users, setUsers] = useState([]);
  const inputRef = useRef(null);
  const notificationRef = useRef(null);
  const settingsRef = useRef(null);
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const getData = () => {
      axios
        .get(`${process.env.REACT_APP_API_URL}/user/`)
        .then((res) => {
          const usersFilters = res.data.filter(
            (profile) => profile.id !== user._id
          );
          setUsers(usersFilters);
        })
        .catch((err) => {
          console.log(err);
        });

      axios
        .get(
          `${process.env.REACT_APP_API_URL}/user/getNotification/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(
                localStorage.getItem("token")
              )}`,
            },
          }
        )
        .then((res) => {
          setNotifications(res.data.notifications);
          setNotificationUnchecked(res.data.unchecked);
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getData();
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotification(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
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
  };

  const deleteAccount = (id) => {
    axios
      .delete(`${process.env.REACT_APP_API_URL}/user/deleteAccount`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
        data: {
          id,
        },
      })
      .then(() => {
        localStorage.clear();
        setUser(null);
        navigate("/");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleNotification = () => {
    if (notificationUnchecked.length > 0) {
      axios
        .put(
          `${process.env.REACT_APP_API_URL}/user/checkNotification`,
          { id: user.id },
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(
                localStorage.getItem("token")
              )}`,
            },
          }
        )
        .then(() => {
          setNotificationUnchecked([]);
        })
        .catch((err) => {
          console.log(err);
        });
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
        <div className="search" onBlur={() => blur(inputRef, setSearch)}>
          <input
            type="text"
            id="search"
            placeholder="Search..."
            ref={inputRef}
            onChange={(e) => handleSearch(e, setSearch, users)}
            onFocus={() => setShowSearch(true)}
          />

          {showSearch && (
            <div className="search-result">
              {search.map((userSearch, index) => (
                <Link
                  key={index}
                  to={`/profile/${userSearch.id}`}
                  style={{ textDecoration: "none" }}
                  onClick={() => {
                    inputRef.current.value = "";
                    setSearch([]);
                  }}
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
              ))}
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
                    <p
                      className="delete-text"
                      onClick={() => deleteAccount(user.id)}
                    >
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
                <p
                  className="delete-text"
                  onClick={() => deleteAccount(user.id)}
                >
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
