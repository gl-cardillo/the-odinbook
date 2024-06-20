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
import { handleSearch, blur, getTime, swalStyle } from "../../utils/utils";
import Swal from "sweetalert2";

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
  const [friendRequestsLength, setFriendRequestsLength] = useState(0);

  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const getData = async () => {
      try {
        const requests = [
          axios.get(`${process.env.REACT_APP_API_URL}/user/`),
          axios.get(
            `${process.env.REACT_APP_API_URL}/user/friendRequests/${user._id}`
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/user/getNotification/${user.id}`
          ),
        ];

        const results = await Promise.all(requests);

        setUsers(results[0].data.filter((profile) => profile.id !== user._id));
        setFriendRequestsLength(results[1].data.length);
        setNotifications(results[2].data.notifications);
        setNotificationUnchecked(results[2].data.unchecked);
      } catch (error) {
        console.log(error);
      }
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
    delete axios.defaults.headers.Authorization;
  };

  const deleteAccount = () => {
    axios
      .delete(`${process.env.REACT_APP_API_URL}/user/deleteAccount`, {
        data: {
          id: user.id,
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

  const handleNotification = () => {
    if (notificationUnchecked.length > 0) {
      axios
        .put(`${process.env.REACT_APP_API_URL}/user/checkNotification`, {
          id: user.id,
        })
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
          {showSearch && inputRef.current.value.length > 0 && (
            <div className="search-result">
              {search.length > 0 ? (
                search.map((userSearch, index) => (
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
