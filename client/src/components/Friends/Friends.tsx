import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { SideMenu } from "../SideMenu/SideMenu";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useFriends } from "../../queries";
import type { User } from "../../types";

// the friends of a profile, or your own on the friends page
export function Friends({ profile }: { profile?: User }) {
  const { user } = useCurrentUser();
  const { data: friends } = useFriends(profile ? profile.id : user.id);

  return (
    <div className="main-page">
      <div className="containers friends">
        {!profile && <h2>Friends</h2>}
        <div className="friends-container">
          {friends ? (
            friends.length > 0 ? (
              friends.map((friend) => (
                <div className="friend" key={friend.id}>
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
              ))
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
