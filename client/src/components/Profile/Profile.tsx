import "./profile.css";
import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { useParams } from "react-router";
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
  changePic,
  handleError,
  errorMessage,
} from "../../utils/utils";
import type { Post as PostType, User } from "../../types";

export function Profile() {
  const { profileId = "" } = useParams();
  const { user } = useCurrentUser();

  const [profile, setProfile] = useState<User | null>(null);
  const [profilePosts, setProfilePosts] = useState<PostType[]>([]);
  const [render, setRender] = useState(1);
  const [showPosts, setShowPosts] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        const [profileData, posts] = await Promise.all([
          axios.get<User>(`/user/profile/${profileId}`),
          axios.get<PostType[]>(`/posts/byUserId/${profileId}`),
        ]);
        setProfile(profileData.data);
        setProfilePosts(posts.data);
      } catch (err) {
        handleError(errorMessage(err));
      }
    };

    getData();
  }, [render, profileId]);

  const changePage = (page: "posts" | "about" | "friends") => {
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
      <div className="containers">
        {profile ? (
          <div className="profile-info-container">
            <div className="cover-container">
              <label htmlFor="cover-pic">
                <img
                  className="profile-cover"
                  src={profile.coverPicUrl}
                  alt="cover picture"
                />
                {user.id === profile.id ? (
                  <div className="overlay">
                    <TiPlusOutline className="pic-icon cover" />
                    <input
                      type="file"
                      id="cover-pic"
                      accept="image/*"
                      onChange={(e) =>
                        changePic(
                          "coverPicUrl",
                          e.target.files?.[0],
                          user,
                          setRender
                        )
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
                <img src={profile.profilePicUrl} alt="avatar" />
                {user.id === profile.id ? (
                  <div className="overlay">
                    <TiPlusOutline className="pic-icon" />
                    <input
                      type="file"
                      id="profile-pic"
                      accept="image/*"
                      onChange={(e) =>
                        changePic(
                          "profilePicUrl",
                          e.target.files?.[0],
                          user,
                          setRender
                        )
                      }
                    />
                  </div>
                ) : (
                  ""
                )}
              </label>
            </div>
            <div className="profile-name-button">
              <p className="profile-username">{profile.fullname}</p>
              {
                // if user is in the profile of other users
                // show fiend buttons
                profileId !== user._id ? (
                  profile.friends.includes(user.id) ? (
                    <button
                      onClick={() =>
                        removeFriend(profileId, user._id, setRender)
                      }
                      className="remove-button"
                    >
                      Remove friend
                    </button>
                  ) : profile.friendRequests.includes(user._id) ? (
                    <button
                      className="remove-button"
                      onClick={() =>
                        removeFriendRequest(profileId, user._id, setRender)
                      }
                    >
                      Remove friend request
                    </button>
                  ) : (
                    <button
                      className="add-button"
                      onClick={() =>
                        addFriendRequest(profileId, user._id, setRender)
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
        {showAbout && profile && (
          <div className="profile-about-section">
            <About profile={profile} setRender={setRender} render={render} />
          </div>
        )}
        {showFriends && profile && (
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
                      setRender={setRender}
                      render={render}
                    />
                  );
                })
              ) : (
                <div className="post no-data-available-container">
                  <p>No post available</p>
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
