import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { BsX } from "react-icons/bs";
import { AiFillLike, AiOutlineClose } from "react-icons/ai";
import { nFormatter, getTime, addLike } from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function Comment({
  comment,
  setRender,
  setShowNewComment,
  showNewComment,
  postId
}) {

  const [author, setAuthor] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [showLikes, setShowLikes] = useState(false);
  const [likes, setLikes] = useState([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const getData = async () => {
      axios
        .get(`/user/profilePic/${comment.authorId}`, {
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

      axios.get(`/posts/getAuthor/${comment.authorId}`).then((res) => {
        setAuthor(res.data);
      });

      axios
        .get(`/comments/getLikes/${comment.id}`)
        .then((res) => {
          setLikes(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getData();
  }, [comment._id]);

  const deleteComment = (id) => {
    axios
      .delete("/comments/deleteComment", {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
        data: {
          id,
        },
      })
      .then(() => {
        setRender((render) => render + 1);
        setShowNewComment(!showNewComment);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="comment-container">
      {profilePicUrl ? (
        <img className="avatar-pic" src={profilePicUrl} alt="avatar" />
      ) : (
        <Skeleton height={50} width={50} circle={true} />
      )}
      <div className="comment-info">
        <div className="comment-author-message">
          <Link to={`/profile/${comment.authorId}`}>
            <p className="author">
              {author ? author : <Skeleton height={20} width={100} />}
            </p>
          </Link>
          <p
            onClick={() => {
              setShowLikes(true);
            }}
            className="comment-message"
          >
            {comment.text}
          </p>
          {comment.likes.length > 0 && (
            <p className="like-comment-count">
              {nFormatter(comment.likes.length)}
              <AiFillLike className="like-comment" />
            </p>
          )}
          {showLikes && (
            // if showlikes is true show a screen with all the user who liked the post
            <div className="black-screen">
              <div className="screen-container">
                <div className="title-button">
                  <h4>Comment liked by</h4>
                  <BsX
                    className="delete-button"
                    onClick={() => {
                      setShowLikes(false);
                    }}
                  />
                </div>
                {likes.map((user, index) => {
                  return (
                    <div key={index} className="likes">
                      <img
                        src={user.profilePicUrl}
                        className="avatar-pic"
                        alt="avatar"
                      />
                      <p>{user.fullname}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="comment-option">
          <p className="time">{getTime(comment.date)}</p>
          <p
            className="like-button"
            onClick={() => addLike("comments", comment, user, setRender, postId)}
          >
            {comment.likes.includes(user.id) ? "liked" : "like"}
          </p>
        </div>
      </div>
      {comment.authorId === user._id && (
        //is the comment author is the user show delete button
        <button
          className="delete-button"
          onClick={() => deleteComment(comment._id)}
        >
          <AiOutlineClose />
        </button>
      )}
    </div>
  );
}
