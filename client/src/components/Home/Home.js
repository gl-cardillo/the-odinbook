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

  const isMoreThen768 = window.matchMedia("(min-width: 768px)");

  useEffect(() => {
    const getData = async () => {
      try {
        const requests = [
          axios.get(
            `${process.env.REACT_APP_API_URL}/posts/getFriendsPost/${user._id}`
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/user/get3SuggestedProfile/${user._id}`
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/user/friendRequests/${user._id}`
          ),
        ];

        const results = await Promise.all(requests);
        setPosts(results[0].data);
        setSuggestedProfile(results[1].data);
        setFriendRequests(results[2].data);
      } catch (error) {
        console.log(error);
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
            posts.map((post, index) => {
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
