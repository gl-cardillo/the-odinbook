import axios from "axios";
import "./sideMenu.css";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link, useNavigate } from "react-router-dom";
import { acceptRequest } from "../../utils/utils";
import { FaSignOutAlt } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function SideMenu({ render, setRender }) {
  let navigate = useNavigate();
  const [requests, setRequests] = useState(null);
  const [friends, setfriends] = useState(null);
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const getRequests = async () => {
      await axios
        .get(`/user/friendRequests3/${user.id}`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        })
        .then((res) => {
          setRequests(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };
    const getFriends = async () => {
      await axios
        .get(`/user/friends3/${user.id}`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        })
        .then((res) => {
          setfriends(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };

    getRequests();
    getFriends();
  }, [render, user.id]);

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
    <div className="side-menu-container">
      <div className="s-m-profile">
        <Link to={`/profile/${user._id}`}>
          {user ? (
            <div>
              <img
                src={user.profilePicUrl}
                className="avatar-pic"
                alt=""
              />
              {user.fullname}
            </div>
          ) : (
            <Skeleton width={100} height={50} />
          )}
        </Link>
        <p onClick={logoutUser}>
          <FaSignOutAlt className="s-m-profile-icon" /> &nbsp;Log out
        </p>
        <p className="delete-account" onClick={() => deleteAccount(user.id)}>
          Delete account
        </p>
      </div>
      <div className="s-m-friendRequests">
        <h3>Requests</h3>
        {requests ? (
          // show user friend requests with link to profile
          requests.length > 0 ? (
            <div>
              {requests.map((request, index) => {
                return (
                  <div className="s-m-div" key={index}>
                    <img
                      src={request.profilePicUrl}
                      className="avatar-pic"
                      alt="avatar"
                    />
                    <Link to={`/profile/${request.id}`}>
                      <p>{request.fullname}</p>
                    </Link>
                    <button
                      onClick={() =>
                        acceptRequest(request.id, user.id, setRender, render)
                      }
                    >
                      Accept
                    </button>
                  </div>
                );
              })}
              <Link to="/friendRequests">
                <p className="see-more">See more...</p>
              </Link>
            </div>
          ) : (
            <p>No requests at moment</p>
          )
        ) : (
          <Skeleton height={30} style={{ margin: "5px 0" }} count={3} />
        )}
      </div>
      <div className="s-m-friendRequests">
        <h3>Friends</h3>
        {friends ? (
          // show user friends with link to profile
          friends.length > 0 ? (
            <div>
              {friends.map((friend, index) => {
                return (
                  <div className="s-m-div" key={index}>
                    <img
                      src={friend.profilePicUrl}
                      className="avatar-pic"
                      alt="avatar"
                    />
                    <Link to={`/profile/${friend.id}`}>
                      <p>{friend.fullname}</p>{" "}
                    </Link>
                  </div>
                );
              })}
              <Link to="/friends">
                <p className="see-more">See more...</p>
              </Link>
            </div>
          ) : (
            <p>No friends at the moment :(</p>
          )
        ) : (
          <Skeleton height={30} style={{ margin: "5px 0" }} count={3} />
        )}
      </div>
    </div>
  );
}
