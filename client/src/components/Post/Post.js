import "./post.css";
import axios from "axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LikeAndComment } from "../LikeAndComment/LikeAndComment";
import { AiOutlineClose } from "react-icons/ai";
import { nFormatter, getTime } from "../../utils/utils";
import { deletePost } from "../../utils/utils";

export function Post({ post, user, setRender, render, index }) {
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [author, setAuthor] = useState("");

  useEffect(() => {
    const getData = async () => {
      axios
        .get(`/user/profilePic/${post.userId}`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        })
        .then((res) => {
          setProfilePicUrl(res.data);
        })
        .catch((err) => {
          console.log(err);
        });

      axios.get(`/posts/getAuthor/${post.userId}`).then((res) => {
        setAuthor(res.data);
      });
    };
    getData();
  }, [post.userId, render]);

  return (
    <div key={index}>
      <div className="post">
        <div className="post-info">
          <Link to={`/profile/${post.userId}`}>
            <img className="avatar-pic" src={profilePicUrl} alt="avatar" />
          </Link>
          <div className="author-time">
            <Link to={`/profile/${post.userId}`}>
              <p className="author">{author}</p>
            </Link>
            <p className="time">{getTime(post.date)}</p>
          </div>
          {
            //if author posts is the user show delete button
            post.userId === user._id && (
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
        <LikeAndComment user={user} post={post} />
      </div>
    </div>
  );
}
