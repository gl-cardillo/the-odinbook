import "./navbar.css";
import axios from "axios";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useState, useRef, useContext, useEffect } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { IoSearch, IoHomeSharp } from "react-icons/io5";
import { BsX } from "react-icons/bs";
import { FiUserPlus, FiUsers, FiUser } from "react-icons/fi";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { handleSearch, blur } from "../../utils/utils";

export function Navbar() {
  let navigate = useNavigate();

  const [search, setSearch] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [users, setUsers] = useState([]);
  const inputRef = useRef(null);
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    axios
      .get("/user/")
      .then((res) => {
        // remove user from the search
        const usersFilters = res.data.filter(
          (profile) => profile.id !== user._id
        );
        setUsers(usersFilters);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const logoutUser = () => {
    localStorage.clear();
    navigate("/");
    setUser(null);
  };

  const deleteAccount = (id) => {
    axios
      .delete("/user/deleteAccount", {
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
            // ref is used in blur for remove the searchresult
            // when user click somewhere else in the page
            ref={inputRef}
            onChange={(e) => handleSearch(e, setSearch, users)}
            onFocus={() => setShowSearch(true)}
          />

          {showSearch ? (
            // show users result from research and like to account
            <div className="search-result">
              {search.map((userSearch, index) => {
                return (
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
                );
              })}{" "}
            </div>
          ) : (
            ""
          )}

          <Link to="/searchPage" state={{ search }}>
            <IoSearch className="icon icon-search" />
          </Link>
        </div>
        {
          // nav-bar buttons is the bar at the bottom for screen < 425px
        }
        <div className="navbar-buttons">
          <Link to="/friendRequests" className=" icon icon-friend">
            <FiUserPlus />
          </Link>
          <Link to="/friends" className=" icon icon-friend">
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
            <p onClick={logoutUser}>
              <FaSignOutAlt className="pic-30px" /> &nbsp;Log out
            </p>
            <p
              className="delete-account"
              onClick={() => deleteAccount(user.id)}
            >
              Delete account
            </p>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
