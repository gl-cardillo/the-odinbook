import { nFormatter, getTime, confirmDelete, handleSuccess } from "../../utils/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { BsX } from "react-icons/bs";
import { AiFillLike } from "react-icons/ai";
import { IoReturnDownForwardOutline } from "react-icons/io5";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { MAX_COMMENT_LENGTH } from "../../api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { MdDelete } from "react-icons/md";
import { useCommentActions, useReplies, useReplyActions } from "../../queries";
import type { Comment as CommentType, Reply } from "../../types";

const schema = yup.object().shape({
  text: yup
    .string()
    .trim()
    .required("Text in the post are required ")
    .max(MAX_COMMENT_LENGTH, `Comments can be at most ${MAX_COMMENT_LENGTH} characters`),
});

type ReplyForm = yup.InferType<typeof schema>;

interface CommentProps {
  comment: CommentType;
  postId: string;
}

export function Comment({ comment, postId }: CommentProps) {
  // author and likes come with the comment
  const likes = comment.likedBy;
  const [showLikes, setShowLikes] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const { user } = useCurrentUser();

  const { data: replies } = useReplies(comment.id, showReply);
  const commentActions = useCommentActions(postId);
  const replyActions = useReplyActions(comment.id, postId);
  const liked = comment.likes.includes(user.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReplyForm>({
    resolver: yupResolver(schema),
  });

  const addReply = (data: ReplyForm) =>
    replyActions.create.mutate(data.text, { onSuccess: () => reset() });

  const onDeleteComment = async () => {
    if (!(await confirmDelete("Are you sure you want to delete this comment?"))) {
      return;
    }
    commentActions.remove.mutate(comment.id, {
      onSuccess: () => handleSuccess("Comment deleted"),
    });
  };

  const onDeleteReply = async (reply: Reply) => {
    if (!(await confirmDelete("Are you sure you want to delete this reply?"))) {
      return;
    }
    replyActions.remove.mutate(reply.id, {
      onSuccess: () => handleSuccess("Reply deleted successfully"),
    });
  };

  return (
    <div className="comment-reply-container">
      <div className="comment-container">
        <Link to={`/profile/${comment.authorId}`}>
          <img
            className="avatar-pic"
            src={comment.author?.profilePicUrl}
            alt="avatar"
          />
        </Link>
        <div className="comment-info">
          <div className="comment-author-message">
            <Link to={`/profile/${comment.authorId}`}>
              <p className="author">
                {comment.author ? comment.author.fullname : "Deleted user"}
              </p>
            </Link>
            <p onClick={() => setShowLikes(true)} className="comment-message">
              {comment.text}
            </p>
            {showLikes && (
              // a screen with all the users who liked the comment
              <div className="black-screen">
                <div className="screen-container">
                  <div className="title-button">
                    <h4>Comment liked by</h4>
                    <BsX
                      className="delete-button"
                      onClick={() => setShowLikes(false)}
                    />
                  </div>
                  {likes.map((liker) => (
                    <div key={liker.id} className="likes">
                      <img
                        src={liker.profilePicUrl}
                        className="avatar-pic"
                        alt="avatar"
                      />
                      <p>{liker.fullname}</p>
                    </div>
                  ))}
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
                commentActions.like.mutate({ id: comment.id, like: !liked })
              }
            >
              {liked ? "Liked" : "Like"}
            </p>
            <p className="button" onClick={() => setShowReply(!showReply)}>
              Reply
            </p>
          </div>
        </div>
        <div className="delete-button-container">
          {comment.authorId === user._id && (
            <button className="delete-button" onClick={onDeleteComment}>
              <MdDelete color="red" size={16} />
            </button>
          )}
        </div>
      </div>
      {comment.repliesCount > 0 && (
        <div onClick={() => setShowReply(!showReply)} className="reply-count">
          <IoReturnDownForwardOutline className="icon-arrow" />
          {replies ? replies.length : comment.repliesCount} Replies
        </div>
      )}
      {showReply && (
        <div className="reply-container">
          {replies ? (
            replies.map((reply) => (
              <div key={reply.id} className="comment-container">
                <Link to={`/profile/${reply.authorId}`}>
                  <img
                    src={reply.author?.profilePicUrl}
                    className="avatar-pic"
                    alt="avatar"
                  />
                </Link>
                <div className="comment-info">
                  <div className="comment-author-message">
                    <Link to={`/profile/${reply.authorId}`}>
                      <p className="author">
                        {reply.author ? reply.author.fullname : "Deleted user"}
                      </p>
                    </Link>
                    <p>{reply.text}</p>
                  </div>
                  <p className="time">{getTime(reply.date)}</p>
                </div>
                {reply.authorId === user._id && (
                  <button
                    className="delete-button"
                    onClick={() => onDeleteReply(reply)}
                  >
                    <MdDelete color="red" size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <Skeleton
              height={50}
              count={comment.repliesCount || 1}
              style={{ margin: "10px 0" }}
            />
          )}
          <div>
            <form className="add-reply" onSubmit={handleSubmit(addReply)}>
              <div>
                <textarea
                  maxLength={MAX_COMMENT_LENGTH}
                  rows={3}
                  {...register("text")}
                  placeholder="Reply to the comment..."
                />
              </div>
              <p className="error-form-comment">{errors?.text?.message}</p>
              <button type="submit" disabled={replyActions.create.isPending}>
                Add Reply
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
