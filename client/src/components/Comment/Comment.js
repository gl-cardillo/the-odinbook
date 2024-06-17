import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { BsX } from "react-icons/bs";
import { AiFillLike, AiOutlineClose } from "react-icons/ai";
import { IoReturnDownForwardOutline } from "react-icons/io5";
import { nFormatter, getTime, addLike } from "../../utils/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function Comment({
  comment,
  setRender,
  setShowNewComment,
  showNewComment,
  postId,
}) {
  const [author, setAuthor] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [showLikes, setShowLikes] = useState(false);
  const [likes, setLikes] = useState([]);
  const { user } = useContext(UserContext);
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState(null);

  useEffect(() => {
    const getData = async () => {
      axios
        .get(
          `${process.env.REACT_APP_API_URL}/user/profilePic/${comment.authorId}`
        )
        .then((res) => {
          setProfilePicUrl(res.data);
        })
        .catch((err) => {
          console.log(err);
        });

      axios
        .get(
          `${process.env.REACT_APP_API_URL}/posts/getAuthor/${comment.authorId}`
        )
        .then((res) => {
          setAuthor(res.data);
        });

      axios
        .get(`${process.env.REACT_APP_API_URL}/comments/getLikes/${comment.id}`)
        .then((res) => {
          setLikes(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getData();
  }, [comment._id]);

  const deleteComment = (id, commentDate) => {
    axios
      .delete(`${process.env.REACT_APP_API_URL}/comments/deleteComment`, {
        data: {
          id,
          postId,
          date: commentDate,
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

  const getReply = () => {
    setShowReply(!showReply);
    axios
      .get(`${process.env.REACT_APP_API_URL}/comments/getReply/${comment.id}`)
      .then((res) => {
        setReplies(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const addReply = (data) => {
    axios
      .post(
        `${process.env.REACT_APP_API_URL}/comments/createReply`,
        {
          text: data.text,
          commentId: comment.id,
          authorId: user._id,
          authorCommentId: comment.authorId,
          postId,
        },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        }
      )
      .then(() => {
        getReply();
        setRender((render) => render + 1);
        setShowReply(true);
      })
      .catch((err) => {
        console.log(err);
      });
    reset();
  };

  const deleteReply = (commentId, authorCommentId, authorReplyId, date) => {
    axios
      .delete(`${process.env.REACT_APP_API_URL}/comments/deleteReply`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
        data: {
          commentId,
          authorReplyId,
          authorCommentId,
          date,
        },
      })
      .then(() => {
        getReply();
        setRender((render) => render + 1);
        setShowReply(true);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const schema = yup.object().shape({
    text: yup.string().required("Text in the post are required "),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <div className="comment-reply-container">
      <div className="comment-container">
        {profilePicUrl ? (
          <Link to={`/profile/${comment.authorId}`}>
            <img className="avatar-pic" src={profilePicUrl} alt="avatar" />
          </Link>
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
          {comment.likes.length > 0 && (
            <p className="like-comment-count">
              {nFormatter(comment.likes.length)}
              <AiFillLike className="like-comment" />
            </p>
          )}
          <div className="comment-option">
            <p className="time">{getTime(comment.date)}</p>
            <p
              className="button"
              onClick={() =>
                addLike("comments", comment, user, setRender, postId)
              }
            >
              {comment.likes.includes(user.id) ? "Liked" : "Like"}
            </p>
            <p className="button" onClick={() => getReply()}>
              Reply
            </p>
          </div>
        </div>
        <div className="delete-button-container">
          {comment.authorId === user._id && (
            //is the comment author is the user show delete button
            <button
              className="delete-button"
              onClick={() => deleteComment(comment._id, comment.date)}
            >
              <AiOutlineClose />
            </button>
          )}
        </div>
      </div>
      {comment.reply.length > 0 && (
        <div onClick={() => getReply()} className="reply-count">
          <IoReturnDownForwardOutline className="icon-arrow" />
          {replies ? replies.length : comment.reply.length} Replies
        </div>
      )}
      {showReply && (
        <div className="reply-container">
          {replies ? (
            replies.length > 0 &&
            replies.map((reply, index) => {
              return (
                <div key={index} className="comment-container">
                  <Link to={`/profile/${reply.authorId}`}>
                    <img
                      src={reply.profilePicUrl}
                      className="avatar-pic"
                      alt="avatar"
                    />
                  </Link>
                  <div className="comment-info">
                    <div className="comment-author-message">
                      <Link to={`/profile/${reply.authorId}`}>
                        <p className="author">{reply.authorFullname}</p>{" "}
                      </Link>
                      <p>{reply.text}</p>
                    </div>
                    <p className="time">{getTime(reply.date)}</p>
                  </div>{" "}
                  {reply.authorId === user._id && (
                    //is the comment author is the user show delete button
                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteReply(
                          comment.id,
                          comment.authorId,
                          reply.authorId,
                          reply.date
                        )
                      }
                    >
                      <AiOutlineClose />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <Skeleton
              height={50}
              count={comment.reply.length}
              style={{ margin: "10px 0" }}
            />
          )}
          <div>
            <form className="add-reply" onSubmit={handleSubmit(addReply)}>
              <div>
                <textarea
                  rows={3}
                  name="text"
                  {...register("text")}
                  placeholder="Reply to the comment..."
                />
              </div>
              <p className="error-form-comment">{errors?.text?.message}</p>
              <button type="submit">Add Reply</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
