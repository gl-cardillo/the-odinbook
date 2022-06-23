import "./home.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { Post } from "../Post/Post";
import { PostForm } from "../PostForm/PostForm";
import { SideMenu } from "../SideMenu/SideMenu";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { addFriendRequest, acceptRequest } from "../../utils/utils";

export function Home() {
  const { user } = useContext(UserContext);

  const [posts, setPosts] = useState(null);
  const [suggestedProfile, setSuggestedProfile] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [render, setRender] = useState(0);

  useEffect(() => {
    const getData = async () => {
      await axios
        .get(`/posts/getFriendsPost/${user._id}`)
        .then((res) => {
          setPosts(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
      await axios
        .get(`/user/get3SuggestedProfile/${user._id}`)
        .then((res) => {
          setSuggestedProfile(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
      await axios
        .get(`/user/friendRequests/${user._id}`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        })
        .then((res) => {
          setFriendRequests(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };

    getData();
  }, [render, user._id]);

  return (
    <div className="main-page">
      <div className="home">
        <PostForm user={user} setRender={setRender} render={render} />
        <div>
          {suggestedProfile ? (
            // show profiles the user is not friend with
            suggestedProfile.length > 0 && (
              <div className="home-suggested-profile-container">
                <h3>People you may know..</h3>
                <div className="home-suggested-profile">
                  {suggestedProfile.map((profile, index) => {
                    return (
                      <div key={index}>
                        <Link to={`/profile/${profile.id}`}>
                          <img src={profile.profilePicUrl} alt="avatar" />
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
                          //if the profile asked the user for frienship
                          // show button Accept
                          friendRequests.filter(
                            (request) => request.id === profile.id
                          ).length > 0 ? (
                            <button
                              onClick={() =>
                                acceptRequest(
                                  profile.id,
                                  user.id,
                                  setRender,
                                  render
                                )
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
                  })}
                </div>
                <Link to={"/suggestedProfiles"}>
                  <p className="see-more">See more..</p>
                </Link>
              </div>
            )
          ) : (
            <Skeleton height={150} style={{ margin: "10px 0" }} />
          )}
        </div>
        {posts ? (
          posts.length > 0 ? (
            posts.map((post, index) => {
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
      <SideMenu render={render} setRender={setRender} />
    </div>
  );
}
