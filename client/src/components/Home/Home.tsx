import "./home.css";
import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { Post } from "../Post/Post";
import { PostForm } from "../PostForm/PostForm";
import { SideMenu } from "../SideMenu/SideMenu";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  addFriendRequest,
  acceptRequest,
  handleError,
  errorMessage,
} from "../../utils/utils";
import { usePagedPosts } from "../../hooks/usePagedPosts";
import type { User, UserSummary } from "../../types";

export function Home() {
  const { user } = useCurrentUser();

  const [suggestedProfile, setSuggestedProfile] = useState<User[] | null>(
    null
  );
  const [friendRequests, setFriendRequests] = useState<UserSummary[]>([]);
  const [render, setRender] = useState(0);

  const { posts, hasMore, loadingMore, loadMore } = usePagedPosts(
    `/posts/getFriendsPost/${user._id}`,
    render
  );

  const isMoreThen768 = window.matchMedia("(min-width: 768px)");

  useEffect(() => {
    const getData = async () => {
      try {
        const [suggested, requests] = await Promise.all([
          axios.get<User[]>(`/user/get3SuggestedProfile/${user._id}`),
          axios.get<UserSummary[]>(`/user/friendRequests/${user._id}`),
        ]);
        setSuggestedProfile(suggested.data);
        setFriendRequests(requests.data);
      } catch (error) {
        console.log(error);
        handleError(errorMessage(error));
      }
    };

    getData();
  }, [render, user._id]);

  return (
    <div className="main-page">
      <div className="containers">
        <PostForm user={user} setRender={setRender} render={render} />
        <div>
          {suggestedProfile ? (
            // show profiles the user is not friend with
            suggestedProfile.length > 0 && (
              <div className="home-suggested-profile-container">
                <h3>People you may know...</h3>
                <div className="home-suggested-profile">
                  {suggestedProfile.map((profile, index) => {
                    return (
                      <div key={index}>
                        <Link to={`/profile/${profile.id}`}>
                          <img
                            src={profile.profilePicUrl}
                            className="avatar-pic"
                            alt="avatar"
                          />
                        </Link>
                        <Link to={`/profile/${profile.id}`}>
                          <p className="none1024px">{profile.firstname}</p>
                        </Link>
                        <Link to={`/profile/${profile.id}`}>
                          <p className="none1024px">{profile.lastname}</p>
                        </Link>
                        <Link to={`/profile/${profile.id}`}>
                          <p className="block1024px">{profile.fullname}</p>
                        </Link>
                        {
                          //if the profile asked the user for friendship
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
                                addFriendRequest(
                                  profile.id,
                                  user._id,
                                  setRender
                                )
                              }
                            >
                              Add
                            </button>
                          )
                        }
                      </div>
                    );
                  })}
                </div>
                <Link to={"/suggestedProfiles"}>
                  <p className="see-more">See more...</p>
                </Link>
              </div>
            )
          ) : (
            <Skeleton height={150} style={{ margin: "10px 0" }} />
          )}
        </div>
        {posts ? (
          posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <Post key={post.id} post={post} setRender={setRender} />
              ))}
              {hasMore && (
                <button
                  className="load-more"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more posts"}
                </button>
              )}
            </>
          ) : (
            <div className="post no-data-available-container">
              <p>No post at the moment</p>
            </div>
          )
        ) : (
          <Skeleton height={300} style={{ margin: "10px 0" }} count={3} />
        )}
      </div>
      {isMoreThen768.matches && (
        <SideMenu render={render} setRender={setRender} />
      )}
    </div>
  );
}
