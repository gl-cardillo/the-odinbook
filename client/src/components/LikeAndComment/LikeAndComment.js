import "./likeAndComment.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { FaRegComment, FaComment } from "react-icons/fa";
import { BsX } from "react-icons/bs";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { useForm } from "react-hook-form";
import { Comment } from "../Comment/Comment";
import { nFormatter, addLike } from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export function LikeAndComment({ post, authorPostId }) {
  const [expandComments, setExpandComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [likes, setLikes] = useState([]);
  const [showNewComment, setShowNewComment] = useState(false);
  const [render, setRender] = useState(1);
  const [showLikes, setShowLikes] = useState(false);

  const { user } = useContext(UserContext);

  useEffect(() => {
    const getData = async () => {
      axios
        .get(`/comments/${post._id}`)
        .then((res) => {
          setComments(res.data);
        })
        .catch((err) => {
          console.log(err);
        });

      axios
        .get(`/posts/getLikes/${post._id}`)
        .then((res) => {
          setLikes(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getData();
  }, [render, post._id]);

  const addComment = (data) => {
    axios
      .post(
        "/comments/createComment",
        {
          text: data.text,
          postId: post.id,
          authorId: user._id,
          authorFullname: user.fullname,
          authorPostId,
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
        setRender((render) => render + 1);
        setShowNewComment(!showNewComment);
      })
      .catch((err) => {
        console.log(err);
      });
    reset();
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
    <div>
      <div className="like-comments-container">
        <div className="likes-count-container">
          {likes.length > 0 ? (
            likes.length > 1 ? (
              // if there are more then 1 like show the first name like plus the number of like
              <p onClick={() => setShowLikes(true)} className="like-count">
                liked by {likes[0].fullname} and an other{" "}
                {nFormatter(likes.length - 1)}
              </p>
            ) : (
              // otherwise if the like is only one show the number who likes
              <p onClick={() => setShowLikes(true)} className="like-count">
                liked by {likes[0].fullname}
              </p>
            )
          ) : (
            ""
          )}
          {showLikes && (
            // if showlikes is true show a screen with all the user who liked the post
            <div className="black-screen">
              <div className="screen-container">
                <div className="title-button">
                  <h4>Post liked by</h4>
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
        <div className="comments-count-contaienr">
          {comments ? (
            //show number of comment per post
            comments.length > 0 ? (
              comments.length > 1 ? (
                <p className="comment-count">
                  {nFormatter(comments.length)} comments
                </p>
              ) : (
                <p className="comment-count">1 comment</p>
              )
            ) : (
              ""
            )
          ) : (
            <Skeleton height={20} width={30} />
          )}
        </div>
      </div>
      <div className="post-buttons">
        <button onClick={() => addLike("posts", post, user, setRender)}>
          {
            //if user liked the post, show blue like instead of trasparent
            likes.filter((profile) => profile.id === user.id).length > 0 ? (
              <AiFillLike className="blue" />
            ) : (
              <AiOutlineLike />
            )
          }
          like
        </button>
        {
          //if user click on the button below show comments
          //set the comment icon blue instead of trasparent
          expandComments ? (
            <button onClick={() => setExpandComments(false)}>
              <FaComment className="blue" /> comment
            </button>
          ) : (
            <button onClick={() => setExpandComments(true)}>
              <FaRegComment /> comment
            </button>
          )
        }
      </div>
      {expandComments && (
        <div>
          {comments ? (
            //show the comments
            comments.map((comment, index) => {
              return (
                <Comment
                  key={index}
                  comment={comment}
                  setRender={setRender}
                  setShowNewComment={setShowNewComment}
                  showNewComment={showNewComment}
                />
              );
            })
          ) : (
            <Skeleton height={80} style={{ margin: "10px 0" }} count={3} />
          )}
          <form className="add-comment" onSubmit={handleSubmit(addComment)}>
            <textarea
              rows={5}
              name="text"
              {...register("text")}
              placeholder="Write a comment..."
            />
            <p className="error-form-comment">{errors?.text?.message}</p>
            <button type="submit">Add comment</button>
          </form>
        </div>
      )}
    </div>
  );
}
