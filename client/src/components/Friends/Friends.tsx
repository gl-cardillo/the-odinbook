import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { SideMenu } from "../SideMenu/SideMenu";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { handleError, errorMessage } from "../../utils/utils";
import type { User, UserSummary } from "../../types";

interface FriendsProps {
  profile?: User;
}

export function Friends({ profile }: FriendsProps) {
  const [friends, setFriends] = useState<UserSummary[] | null>(null);
  const { user } = useCurrentUser();
  const id = profile ? profile.id : user.id;

  useEffect(() => {
    const getFriends = async () => {
      try {
        const friendsList = await axios.get<UserSummary[]>(
          `/user/friends/${id}`
        );
        setFriends(friendsList.data);
      } catch (err) {
        console.log(err);
        handleError(errorMessage(err));
      }
    };
    getFriends();
  }, [id]);

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
