import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { SideMenu } from "../SideMenu/SideMenu";
import {
  acceptRequest,
  declineRequest,
  handleError,
  errorMessage,
} from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import type { UserSummary } from "../../types";

export function FriendRequests() {
  const [requests, setRequests] = useState<UserSummary[] | null>(null);
  const [render, setRender] = useState(1);

  const { user } = useCurrentUser();

  useEffect(() => {
    const getRequests = async () => {
      try {
        const requestsList = await axios.get<UserSummary[]>(
          `/user/friendRequests/${user.id}`
        );

        setRequests(requestsList.data);
      } catch (err) {
        console.log(err);
        handleError(errorMessage(err));
      }
    };
    getRequests();
  }, [render, user.id]);

  return (
    <div className="main-page">
      <div className="containers friend-requests">
        <h2>Friend Requests</h2>
        <div className="requests-container">
          {requests ? (
            // if there are requests show them
            requests.length > 0 ? (
              requests.map((request, index) => {
                return (
                  <div className="requests" key={index}>
                    <Link to={`/profile/${request.id}`}>
                      <img
                        src={request.profilePicUrl}
                        className="avatar-pic"
                        alt="avatar"
                      />
                    </Link>
                    <Link to={`/profile/${request.id}`}>
                      <p>{request.fullname}</p>
                    </Link>
                    <div className="friend-requests-button">
                      <button
                        className="add-button"
                        onClick={() =>
                          acceptRequest(request.id, user.id, setRender)
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="remove-button"
                        onClick={() =>
                          declineRequest(request.id, user.id, setRender)
                        }
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <h3>No friend requests at the moment</h3>
            )
          ) : (
            <Skeleton height={80} style={{ margin: "5px 0" }} count={3} />
          )}
        </div>
      </div>
      <SideMenu render={render} setRender={setRender} />
    </div>
  );
}
