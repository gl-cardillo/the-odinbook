import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { addFriendRequest, acceptRequest } from "../../utils/utils";
import { SideMenu } from "../SideMenu/SideMenu";

export function SuggestedProfile() {
  const [suggestedProfile, setsuggestedProfile] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [render, setRender] = useState(1);

  const { user } = useContext(UserContext);

  useEffect(() => {
    const getData = async () => {
      await axios
        .get(
          `${process.env.REACT_APP_API_URL}/user/getSuggestedProfile/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(
                localStorage.getItem("token")
              )}`,
            },
          }
        )
        .then((res) => {
          setsuggestedProfile(res.data);
        })
        .catch((err) => {
          console.log(err);
        });

      await axios
        .get(
          `${process.env.REACT_APP_API_URL}/user/friendRequests/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(
                localStorage.getItem("token")
              )}`,
            },
          }
        )
        .then((res) => {
          setFriendRequests(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };

    getData();
  }, [render, user.id]);

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
                          acceptRequest(profile.id, user.id, setRender, render)
                        }
                      >
                        Accept
                      </button>
                    ) : profile.friendRequests.includes(user._id) ? (
                      // if the user arleady send the friend request
                      // show disabled button added
                      <button disabled>Added</button>
                    ) : (
                      // otherwise show button Add
                      <button
                        onClick={() =>
                          addFriendRequest(
                            profile.id,
                            user._id,
                            setRender,
                            render
                          )
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
            <h3>No profiles available at the moment :(</h3>
          )}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
