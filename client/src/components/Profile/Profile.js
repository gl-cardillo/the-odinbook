import "./profile.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { useParams } from "react-router-dom";
import { Post } from "../Post/Post";
import { PostForm } from "../PostForm/PostForm";
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

  const changeProfilePic = async (file) => {
    if (
      file.type === "image/bmp" ||
      file.type === "image/gif" ||
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/tiff" ||
      file.type === "image/webp"
    ) {
      let url;
      axios
        .get(`/user/generateUrlS3/`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        }).then((res) => {
          url = res.data
        })
        .catch((err) => {
          console.log(err);
        });

      axios
        .put(url.data, file, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then(async () => {
          const imageUrl = url.data.split("?")[0];
          await axios.put(
            `/user/changeProfilePic`,
            {
              imageUrl,
              id: user.id,
            },
            {
              headers: {
                Authorization: `Bearer ${JSON.parse(
                  localStorage.getItem("token")
                )}`,
              },
            }
          );
          user.profilePicUrl = imageUrl;
          localStorage.setItem("user", JSON.stringify(user));
          setRender((render) => render + 1);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      alert("Insert a vaild image format (bmp, gif, jpeg, png, tiff, webp)");
    }
  };

  return (
    <div className="main-page">
      <div className="profile">
        <div className="profile-info-container">
          <div className="profile-pic-container">
            <label htmlFor="file-input">
              <img src={profile && profile.profilePicUrl} alt="avatar" />
              {profile && user.id === profile.id ? (
                <div className="overlay">
                  <TiPlusOutline className="pic-icon" />
                </div>
              ) : (
                ""
              )}
            </label>
            <input
              type="file"
              id="file-input"
              accept="image/*"
              onChange={(e) => changeProfilePic(e.target.files[0])}
            />
          </div>
          <div className="profile-name-button">
            <p className="username">{profile && profile.fullname}</p>
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
                    Send friend request
                  </button>
                )
              ) : (
                ""
              )
            }
          </div>
        </div>
        <div>
          {profile && profileId === user._id && (
            <PostForm user={user} setRender={setRender} render={render} />
          )}
        </div>
        <div className="profile-post-section">
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
            <Skeleton height={300} style={{ margin: "10px 0" }} count={3} />
          )}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
