import "./likeAndComment.css";
import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { FaRegComment, FaComment } from "react-icons/fa";
import { BsX } from "react-icons/bs";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { useForm } from "react-hook-form";
import { Comment } from "../Comment/Comment";
import {
  nFormatter,
  addLike,
  handleError,
  errorMessage,
} from "../../utils/utils";
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
  authorPostId: string;
}

export function LikeAndComment({ post, authorPostId }: LikeAndCommentProps) {
  const [expandComments, setExpandComments] = useState(false);
  const [comments, setComments] = useState<CommentType[] | null>(null);
  const [likes, setLikes] = useState<UserSummary[]>([]);
  const [showNewComment, setShowNewComment] = useState(false);
  const [render, setRender] = useState(1);
  const [showLikes, setShowLikes] = useState(false);

  const { user } = useCurrentUser();

  useEffect(() => {
    const getData = async () => {
      try {
        const [postComments, postLikes] = await Promise.all([
          axios.get<CommentType[]>(`/comments/${post._id}`),
          axios.get<UserSummary[]>(`/posts/getLikes/${post._id}`),
        ]);

        setComments(postComments.data);
        setLikes(postLikes.data);
      } catch (err) {
        console.log(err);
        handleError(errorMessage(err));
      }
    };
    getData();
  }, [render, post._id]);

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
        authorId: user._id,
        authorPostId,
      });
      setRender((render) => render + 1);
      setShowNewComment(!showNewComment);
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
          {comments ? (
            //show number of comment per post
            comments.length > 0 ? (
              comments.length > 1 ? (
                <p
                  className="comment-count"
                  onClick={() => setExpandComments(!expandComments)}
                >
                  {" "}
                  {nFormatter(comments.length)} comments
                </p>
              ) : (
                <p
                  className="comment-count"
                  onClick={() => setExpandComments(!expandComments)}
                >
                  1 comment
                </p>
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
            //if user liked the post, show blue like instead of transparent
            likes.filter((profile) => profile.id === user.id).length > 0 ? (
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
            comments.map((comment, index) => {
              return (
                <Comment
                  key={index}
                  comment={comment}
                  setRender={setRender}
                  setShowNewComment={setShowNewComment}
                  showNewComment={showNewComment}
                  postId={post.id}
                />
              );
            })
          ) : (
            <Skeleton height={80} style={{ margin: "10px 0" }} count={3} />
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
