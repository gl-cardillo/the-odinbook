import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import {
  addFriendRequest,
  acceptRequest,
  handleError,
  errorMessage,
} from "../../utils/utils";
import { SideMenu } from "../SideMenu/SideMenu";
import type { User, UserSummary } from "../../types";

export function SuggestedProfile() {
  const [suggestedProfile, setSuggestedProfile] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<UserSummary[]>([]);
  const [render, setRender] = useState(1);

  const { user } = useCurrentUser();

  useEffect(() => {
    const getData = async () => {
      try {
        const [suggested, requests] = await Promise.all([
          axios.get<User[]>(`/user/getSuggestedProfile/${user._id}`),
          axios.get<UserSummary[]>(`/user/friendRequests/${user._id}`),
        ]);
        setSuggestedProfile(suggested.data);
        setFriendRequests(requests.data);
      } catch (err) {
        console.log(err);
        handleError(errorMessage(err));
      }
    };

    getData();
  }, [render, user._id]);

  return (
    <div className="main-page">
      <div className="suggested-profile-page">
        <h2>People you may know...</h2>
        <div className="suggested-profile-container">
          {suggestedProfile.length > 0 ? (
            // lists of profiles that are not friend with the user
            suggestedProfile.map((profile, index) => {
              return (
                <div className="suggested-profile" key={index}>
                  <img
                    src={profile.profilePicUrl}
                    className="avatar-pic"
                    alt="avatar"
                  />
                  <Link to={`/profile/${profile.id}`}>
                    <p className="username">{profile.fullname}</p>
                  </Link>
                  {
                    // if the profile asked the user for friendship
                    // show button Accept
                    friendRequests.filter(
                      (request) => request.id === profile.id
                    ).length > 0 ? (
                      <button
                        onClick={() =>
                          acceptRequest(profile.id, user.id, setRender)
                        }
                      >
                        Accept
                      </button>
                    ) : profile.friendRequests.includes(user._id) ? (
                      // if the user already send the friend request
                      // show disabled button added
                      <button disabled>Added</button>
                    ) : (
                      // otherwise show button Add
                      <button
                        onClick={() =>
                          addFriendRequest(profile.id, user._id, setRender)
                        }
                      >
                        Add
                      </button>
                    )
                  }
                </div>
              );
            })
          ) : (
            <div className="post no-data-available-container">
              <p>No profiles available at the moment</p>
            </div>
          )}
        </div>
      </div>
      <SideMenu render={render} setRender={setRender} />
    </div>
  );
}
