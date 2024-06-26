import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { SideMenu } from "../SideMenu/SideMenu";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { handleError } from "../../utils/utils";

export function Friends({ profile }) {
  const [friends, setFriends] = useState(null);
  const [render, setRender] = useState(1);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const getFriends = async () => {
      try {
        let id;
        if (!profile) {
          id = user.id;
        } else {
          id = profile.id;
        }
        const friendsList = await axios.get(
          `${process.env.REACT_APP_API_URL}/user/friends/${id}`
        );
        setFriends(friendsList.data);
      } catch (err) {
        console.log(err);
        handleError(err?.response?.data?.message);
      }
    };
    getFriends();
  }, [render, user.id]);

  return (
    <div className="main-page">
      <div className="containers friends">
        {!profile && <h2>Friends</h2>}
        <div className="friends-container">
          {friends ? (
            // if the users has friend show them
            friends.length > 0 ? (
              friends.map((friend, index) => {
                return (
                  <div className="friend" key={index}>
                    <Link to={`/profile/${friend.id}`}>
                      <img
                        src={friend.profilePicUrl}
                        className="avatar-pic"
                        alt="avatar"
                      />
                    </Link>
                    <Link to={`/profile/${friend.id}`}>
                      <p className="username">{friend.fullname}</p>
                    </Link>
                  </div>
                );
              })
            ) : (
              <h3>No friends at the moment</h3>
            )
          ) : (
            <Skeleton height={80} style={{ margin: "10px 0" }} count={3} />
          )}
        </div>
      </div>
      {!profile && <SideMenu />}
    </div>
  );
}
