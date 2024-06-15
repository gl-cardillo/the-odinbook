import "./post.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { LikeAndComment } from "../LikeAndComment/LikeAndComment";
import { AiOutlineClose } from "react-icons/ai";
import { getTime } from "../../utils/utils";
import { deletePost } from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function Post({ post, setRender, render }) {
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [author, setAuthor] = useState("");
  const { user } = useContext(UserContext);

  useEffect(() => {
    const getData = async () => {
      axios
        .get(
          `${process.env.REACT_APP_API_URL}/user/profilePic/${post.authorId}`,
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(
                localStorage.getItem("token")
              )}`,
            },
          }
        )
        .then((res) => {
          setProfilePicUrl(res.data);
        })
        .catch((err) => {
          console.log(err);
        });

      axios
        .get(
          `${process.env.REACT_APP_API_URL}/posts/getAuthor/${post.authorId}`
        )
        .then((res) => {
          setAuthor(res.data);
        });
    };
    getData();
  }, [post.authorId, render]);

  return (
    <div>
      <div className="post">
        <div className="post-info">
          <Link to={`/profile/${post.userId}`}>
            {profilePicUrl ? (
              <img className="avatar-pic" src={profilePicUrl} alt="avatar" />
            ) : (
              <Skeleton height={50} width={50} circle={true} />
            )}
          </Link>
          <div className="author-time">
            <Link to={`/profile/${post.authorId}`}>
              <p className="author">
                {author ? author : <Skeleton height={20} width={100} />}
              </p>
            </Link>
            <p className="time">{getTime(post.date)}</p>
          </div>
          {
            //if author posts is the user show delete button
            post.authorId === user._id && (
              <button
                className="delete-button"
                onClick={() => deletePost(post, setRender, render)}
              >
                <AiOutlineClose />
              </button>
            )
          }
        </div>
        <p className="post-message">{post.text}</p>
        <img className="post-image" src={post.picUrl} />
        <LikeAndComment post={post} authorPostId={post.authorId} />
      </div>
    </div>
  );
}
