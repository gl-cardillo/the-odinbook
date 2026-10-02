import "./sideMenu.css";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  useFriendActions,
  useFriendRequests,
  useFriends,
} from "../../queries";

export function SideMenu() {
  const { user } = useCurrentUser();
  const { data: requests } = useFriendRequests(3);
  const { data: friends } = useFriends(user.id, 3);
  const { accept } = useFriendActions();

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
          requests.length > 0 ? (
            <div>
              {requests.map((request) => (
                <div className="s-m-div" key={request.id}>
                  <img
                    src={request.profilePicUrl}
                    className="avatar-pic"
                    alt="avatar"
                  />
                  <Link to={`/profile/${request.id}`}>
                    <p>{request.fullname}</p>
                  </Link>
                  <button
                    onClick={() => accept.mutate(request.id)}
                    disabled={accept.isPending}
                  >
                    Accept
                  </button>
                </div>
              ))}
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
          friends.length > 0 ? (
            <div>
              {friends.map((friend) => (
                <div className="s-m-div" key={friend.id}>
                  <img
                    src={friend.profilePicUrl}
                    className="avatar-pic"
                    alt="avatar"
                  />
                  <Link to={`/profile/${friend.id}`}>
                    <p>{friend.fullname}</p>
                  </Link>
                </div>
              ))}
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
