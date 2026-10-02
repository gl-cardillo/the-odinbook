import "./likeAndComment.css";
import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { FaRegComment, FaComment } from "react-icons/fa";
import { BsX } from "react-icons/bs";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { useForm } from "react-hook-form";
import { Comment } from "../Comment/Comment";
import { nFormatter, handleError, errorMessage } from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type {
  Comment as CommentType,
  Post,
  UserSummary,
} from "../../types";

const schema = yup.object().shape({
  text: yup.string().required("Text in the post are required "),
});

type CommentForm = yup.InferType<typeof schema>;

interface LikeAndCommentProps {
  post: Post;
}

export function LikeAndComment({ post }: LikeAndCommentProps) {
  const [expandComments, setExpandComments] = useState(false);
  // likes and count come with the post, comments are loaded only when opened
  const [likes, setLikes] = useState<UserSummary[]>(post.likedBy);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [comments, setComments] = useState<CommentType[] | null>(null);
  const [render, setRender] = useState(1);
  const [showLikes, setShowLikes] = useState(false);

  const { user } = useCurrentUser();

  useEffect(() => {
    setLikes(post.likedBy);
    setCommentsCount(post.commentsCount);
  }, [post]);

  useEffect(() => {
    if (!expandComments) return;
    let ignore = false;
    axios
      .get<CommentType[]>(`/comments/${post.id}`)
      .then((res) => {
        if (ignore) return;
        setComments(res.data);
        setCommentsCount(res.data.length);
      })
      .catch((err) => {
        if (!ignore) handleError(errorMessage(err));
      });
    return () => {
      ignore = true;
    };
  }, [expandComments, render, post.id]);

  const toggleLike = async () => {
    try {
      await axios.put(`/posts/addLike`, { elementId: post.id });
      const res = await axios.get<UserSummary[]>(`/posts/getLikes/${post.id}`);
      setLikes(res.data);
    } catch (err) {
      handleError(errorMessage(err));
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommentForm>({
    resolver: yupResolver(schema),
  });

  const addComment = async (data: CommentForm) => {
    try {
      await axios.post(`/comments/createComment`, {
        text: data.text,
        postId: post.id,
      });
      setRender((render) => render + 1);
    } catch (err) {
      console.log(err);
      handleError(errorMessage(err));
    }

    reset();
  };

  return (
    <div>
      <div className="like-comments-container">
        <div className="likes-count-container">
          {likes.length > 0 ? (
            likes.length > 1 ? (
              // if there are more then 1 like show the first name like plus the number of like
              <p onClick={() => setShowLikes(true)} className="like-count">
                <AiFillLike className="like-comment" /> {likes[0].fullname} and
                an other {nFormatter(likes.length - 1)}
              </p>
            ) : (
              // otherwise if the like is only one show the number who likes
              <p onClick={() => setShowLikes(true)} className="like-count">
                <AiFillLike className="like-comment" /> {likes[0].fullname}
              </p>
            )
          ) : (
            ""
          )}
          {showLikes && (
            // if show likes is true show a screen with all the user who liked the post
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
          {
            //show number of comment per post
            commentsCount > 0 && (
              <p
                className="comment-count"
                onClick={() => setExpandComments(!expandComments)}
              >
                {commentsCount > 1
                  ? `${nFormatter(commentsCount)} comments`
                  : "1 comment"}
              </p>
            )
          }
        </div>
      </div>
      <div className="post-buttons">
        <button onClick={toggleLike}>
          {
            //if user liked the post, show blue like instead of transparent
            likes.some((profile) => profile.id === user.id) ? (
              <AiFillLike className="blue" />
            ) : (
              <AiOutlineLike />
            )
          }
          Like
        </button>

        <button onClick={() => setExpandComments(!expandComments)}>
          {
            //if user click on the button below show comments
            //set the comment icon blue instead of transparent
            expandComments ? <FaComment className="blue" /> : <FaRegComment />
          }
          Comment
        </button>
      </div>
      {expandComments && (
        <div>
          {comments ? (
            //show the comments
            comments.map((comment) => {
              return (
                <Comment
                  key={comment.id}
                  comment={comment}
                  setRender={setRender}
                  postId={post.id}
                />
              );
            })
          ) : (
            <Skeleton
              height={80}
              style={{ margin: "10px 0" }}
              count={Math.min(commentsCount, 3) || 1}
            />
          )}
          <form className="add-comment" onSubmit={handleSubmit(addComment)}>
            <textarea
              rows={5}
              {...register("text")}
              placeholder="Write a comment..."
            />
            <p className="error-form-comment">{errors?.text?.message}</p>
            <button type="submit">Add Comment</button>
          </form>
        </div>
      )}
    </div>
  );
}
