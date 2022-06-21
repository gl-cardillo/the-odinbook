import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { removeFriend } from "../../utils/utils";
import { SideMenu } from "../SideMenu/SideMenu";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function Friends() {
  const [friends, setfriends] = useState(null);
  const [render, setRender] = useState(1);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const getFriends = async () => {
      try {
        const friendsList = await axios.get(`/user/friends/${user.id}`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        });
        setfriends(friendsList.data);
      } catch (err) {
        console.log(err);
      }
    };
    getFriends();
  }, [render, user.id]);

  return (
    <div className="main-page">
      <div className="friends">
        <h2>Friends</h2>
        <div className="friends-container">
          {friends ? (
            // if the users has friend show them
            friends.length > 0 ? (
              friends.map((friend, index) => {
                return (
                  <div className="friend" key={index}>
                    <img src={friend.profilePicUrl} alt="avatar" />
                    <Link to={`/profile/${friend.id}`}>
                      <p className="username">{friend.fullname}</p>
                    </Link>
                    <button
                      className="remove-button"
                      onClick={() =>
                        removeFriend(friend.id, user.id, setRender, render)
                      }
                    >
                      Remove Friend
                    </button>
                  </div>
                );
              })
            ) : (
              <h3>No friends at the moment :(</h3>
            )
          ) : (
            <Skeleton height={80} style={{ margin: "10px 0" }} count={3} />
          )}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
