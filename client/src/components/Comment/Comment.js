import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { AiOutlineLike, AiFillLike, AiOutlineClose } from "react-icons/ai";

export function Comment({
  comment,
  setRender,
  setShowNewComment,
  showNewComment,
}) {
  const [author, setAuthor] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const getData = async () => {
      axios
        .get(`/user/profilePic/${comment.userId}`, {
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
      axios.get(`/posts/getAuthor/${comment.userId}`).then((res) => {
        setAuthor(res.data);
      });
    };
    getData();
  }, [ comment._id]);

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
      <img src={profilePicUrl} className="avatar-pic" alt="avatar" />
      <div className="comment-info">
        <div className="comment-author-message">
          <Link to={`/profile/${comment.userId}`}>
            <p className="author">{author}</p>
          </Link>
          <p className="comment-message">{comment.text}</p>
        </div>
        <div className="comment-option">
          <p>like</p>
          <p className="time">{comment.date_formatted}</p>
        </div>
      </div>
      {comment.userId === user._id && (
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
