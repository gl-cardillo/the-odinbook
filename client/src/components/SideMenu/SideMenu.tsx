import axios from "axios";
import "./sideMenu.css";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { acceptRequest, handleError, errorMessage } from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import type { SetRender, UserSummary } from "../../types";

interface SideMenuProps {
  render?: number;
  setRender?: SetRender;
}

export function SideMenu({ render, setRender }: SideMenuProps) {
  const [requests, setRequests] = useState<UserSummary[] | null>(null);
  const [friends, setFriends] = useState<UserSummary[] | null>(null);
  // pages that don't share their render counter still need to refresh the menu
  const [localRender, setLocalRender] = useState(0);
  const { user } = useCurrentUser();

  useEffect(() => {
    const getData = async () => {
      try {
        const [userRequests, userFriends] = await Promise.all([
          axios.get<UserSummary[]>(`/user/friendRequests3/${user.id}`),
          axios.get<UserSummary[]>(`/user/friends3/${user.id}`),
        ]);
        setRequests(userRequests.data);
        setFriends(userFriends.data);
      } catch (err) {
        console.log(err);
        handleError(errorMessage(err));
      }
    };

    getData();
  }, [render, localRender, user.id]);

  return (
    <div className="side-menu-container">
      <div className="s-m-profile">
        <Link to={`/profile/${user._id}`}>
          <div>
            <img src={user.profilePicUrl} className="avatar-pic" alt="" />
            {user.fullname}
          </div>
        </Link>
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
                        acceptRequest(
                          request.id,
                          user.id,
                          setRender ?? setLocalRender
                        )
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
            <p>No friends at the moment </p>
          )
        ) : (
          <Skeleton height={30} style={{ margin: "5px 0" }} count={3} />
        )}
      </div>
    </div>
  );
}
