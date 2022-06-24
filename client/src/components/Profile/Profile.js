import "./profile.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { useParams } from "react-router-dom";
import { Post } from "../Post/Post";
import { PostForm } from "../PostForm/PostForm";
import { Friends } from "../Friends/Friends";
import { About } from "../About/About";
import { SideMenu } from "../SideMenu/SideMenu";
import { TiPlusOutline } from "react-icons/ti";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  addFriendRequest,
  removeFriendRequest,
  removeFriend,
} from "../../utils/utils";

export function Profile() {
  const { profileId } = useParams();
  const { user } = useContext(UserContext);

  const [profile, setProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [render, setRender] = useState(1);
  const [showPosts, setShowPosts] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    const getData = async () => {
      axios
        .get(`/user/profile/${profileId}`)
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
      await axios
        .get(`/posts/byUserId/${profileId}`)
        .then((res) => {
          setProfilePosts(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };

    getData();
  }, [render, profileId]);

  const changePic = async (profileOrCover, file) => {
    if (
      file.type === "image/bmp" ||
      file.type === "image/gif" ||
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/tiff" ||
      file.type === "image/webp"
    ) {
      try {
        // create url to store image
        const url = await axios.get(`/user/generateUrlS3/`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        });
        // sotre image to the url
        await axios.put(url.data, file, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const imageUrl = url.data.split("?")[0];

        // update the user in the database with the right url
        await axios.put(
          `/user/changePic`,
          {
            imageUrl,
            id: user.id,
            profileOrCover,
          },
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(
                localStorage.getItem("token")
              )}`,
            },
          }
        );

        const userUpdate = await axios.get(`/user/profile/${user._id}`);
        localStorage.setItem("user", JSON.stringify(userUpdate.data));
        setRender((render) => render + 1);
      } catch (error) {
        console.log(error);
      }
    } else {
      alert("Insert a vaild image format (bmp, gif, jpeg, png, tiff, webp)");
    }
  };

  const changePage = (page) => {
    if (page === "posts") {
      setShowPosts(true);
      setShowAbout(false);
      setShowFriends(false);
    } else if (page === "about") {
      setShowAbout(true);
      setShowPosts(false);
      setShowFriends(false);
    } else {
      setShowFriends(true);
      setShowAbout(false);
      setShowPosts(false);
    }
  };

  return (
    <div className="main-page">
      <div className="profile">
        {" "}
        {profile ? (
          <div className="profile-info-container">
            <div className="cover-container">
              {profile ? "" : <Skeleton height={400} />}
              <label htmlFor="cover-pic">
                <img
                  className="profile-cover"
                  src={profile && profile.coverPicUrl}
                  alt="cover picture"
                />
                {profile && user.id === profile.id ? (
                  <div className="overlay">
                    <TiPlusOutline className="pic-icon cover" />
                    <input
                      type="file"
                      id="cover-pic"
                      accept="image/*"
                      onChange={(e) =>
                        changePic("coverPicUrl", e.target.files[0])
                      }
                    />
                  </div>
                ) : (
                  ""
                )}
              </label>
            </div>
            <div className="profile-pic-container">
              <label htmlFor="profile-pic">
                <img src={profile && profile.profilePicUrl} alt="avatar" />
                {profile && user.id === profile.id ? (
                  <div className="overlay">
                    <TiPlusOutline className="pic-icon" />
                    <input
                      type="file"
                      id="profile-pic"
                      accept="image/*"
                      onChange={(e) =>
                        changePic("profilePicUrl", e.target.files[0])
                      }
                    />
                  </div>
                ) : (
                  ""
                )}
              </label>
            </div>
            <div className="profile-name-button">
              <p className="profile-username">{profile && profile.fullname}</p>
              {
                // if user is in the profile of other users
                // show fiend buttons
                profile && profileId !== user._id ? (
                  profile.friends.includes(user.id) ? (
                    <button
                      onClick={() =>
                        removeFriend(profileId, user._id, setRender, render)
                      }
                      className="remove-button"
                    >
                      Remove friend
                    </button>
                  ) : profile.friendRequests.includes(user._id) ? (
                    <button
                      className="remove-button"
                      onClick={() =>
                        removeFriendRequest(
                          profileId,
                          user._id,
                          setRender,
                          render
                        )
                      }
                    >
                      Remove friend request
                    </button>
                  ) : (
                    <button
                      className="add-button"
                      onClick={() =>
                        addFriendRequest(profileId, user._id, setRender, render)
                      }
                    >
                      Add friend 
                    </button>
                  )
                ) : (
                  ""
                )
              }
            </div>
            <div className="profile-section">
              <button
                className={showPosts ? "active-section" : ""}
                onClick={() => changePage("posts")}
              >
                Posts
              </button>
              <button
                className={showFriends ? "active-section" : ""}
                onClick={() => changePage("friends")}
              >
                Friends
              </button>
              <button
                className={showAbout ? "active-section" : ""}
                onClick={() => changePage("about")}
              >
                About
              </button>
            </div>
          </div>
        ) : (
          <Skeleton height={500} />
        )}
        {showAbout && (
          <div className="profile-about-section">
            <About profile={profile} setRender={setRender} render={render} />
          </div>
        )}
        {showFriends && (
          <div className="profile-friends-section">
            <Friends profile={profile} />
          </div>
        )}
        {showPosts && (
          <div className="profile-post-section">
            <div>
              {profile && profileId === user._id && (
                <PostForm user={user} setRender={setRender} render={render} />
              )}
            </div>
            {profilePosts ? (
              profilePosts.length > 0 ? (
                profilePosts.map((post, index) => {
                  return (
                    <Post
                      key={index}
                      post={post}
                      user={user}
                      setRender={setRender}
                      render={render}
                    />
                  );
                })
              ) : (
                <div className="post">
                  <p>No post available :(</p>
                </div>
              )
            ) : (
              <Skeleton height={250} style={{ margin: "10px 0" }} count={3} />
            )}
          </div>
        )}
      </div>
      <SideMenu />
    </div>
  );
}
