import { Link } from "react-router";
import { SideMenu } from "../SideMenu/SideMenu";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useFriendActions, useFriendRequests } from "../../queries";

export function FriendRequests() {
  const { data: requests } = useFriendRequests();
  const { accept, decline } = useFriendActions();

  return (
    <div className="main-page">
      <div className="containers friend-requests">
        <h2>Friend Requests</h2>
        <div className="requests-container">
          {requests ? (
            requests.length > 0 ? (
              requests.map((request) => (
                <div className="requests" key={request.id}>
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
                      onClick={() => accept.mutate(request.id)}
                      disabled={accept.isPending}
                    >
                      Accept
                    </button>
                    <button
                      className="remove-button"
                      onClick={() => decline.mutate(request.id)}
                      disabled={decline.isPending}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <h3>No friend requests at the moment</h3>
            )
          ) : (
            <Skeleton height={80} style={{ margin: "5px 0" }} count={3} />
          )}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
