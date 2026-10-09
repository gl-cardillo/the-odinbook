import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { AiFillLike } from "react-icons/ai";
import { MdDelete } from "react-icons/md";
import Skeleton from "react-loading-skeleton";
import { nFormatter } from "../../utils/utils";
import { useCurrentUser } from "../../dataContext/dataContext";
import { useCommentActions, useReplies, useReplyActions } from "../../queries";
import { Avatar, confirmDelete, RelativeTime, toast } from "../ui";
import { LikesModal } from "../LikeAndComment/LikesModal";
import { CommentForm } from "./CommentForm";
import type { Comment as CommentType, Reply, UserSummary } from "../../types";
import styles from "./Comment.module.scss";

interface EntryProps {
  author?: UserSummary | null;
  authorId: string;
  text: string;
  meta: ReactNode;
  onDelete?: () => void;
  deleteLabel: string;
  small?: boolean;
}

// the avatar, the bubble with the text and the line of actions under it
function Entry({
  author,
  authorId,
  text,
  meta,
  onDelete,
  deleteLabel,
  small,
}: EntryProps) {
  const name = author ? author.fullname : "";

  return (
    <div className={styles.entry}>
      <Link to={`/profile/${authorId}`} tabIndex={-1}>
        <Avatar
          src={author?.profilePicUrl}
          name={name}
          size={small ? "xs" : "sm"}
          alt=""
        />
      </Link>
      <div className={styles.body}>
        <div className={styles.bubbleRow}>
          <div className={styles.bubble}>
            <Link to={`/profile/${authorId}`} className={styles.author}>
              {name || "Deleted user"}
            </Link>
            <p className={styles.text} data-cy="comment-text">
              {text}
            </p>
          </div>
          {onDelete && (
            <button
              className={styles.delete}
              onClick={onDelete}
              aria-label={deleteLabel}
              data-cy="delete-comment"
            >
              <MdDelete />
            </button>
          )}
        </div>
        <div className={styles.meta}>{meta}</div>
      </div>
    </div>
  );
}

interface CommentProps {
  comment: CommentType;
  postId: string;
}

export function Comment({ comment, postId }: CommentProps) {
  const [showLikes, setShowLikes] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { user } = useCurrentUser();

  const { data: replies } = useReplies(comment.id, showReplies);
  const commentActions = useCommentActions(postId);
  const replyActions = useReplyActions(comment.id, postId);
  const liked = comment.likes.includes(user.id);
  const repliesCount = replies ? replies.length : comment.repliesCount;

  const onDeleteComment = async () => {
    if (
      !(await confirmDelete(
        "Delete comment?",
        "Are you sure you want to delete this comment?"
      ))
    ) {
      return;
    }
    commentActions.remove.mutate(comment.id, {
      onSuccess: () => toast.success("Comment deleted"),
    });
  };

  const onDeleteReply = async (reply: Reply) => {
    if (
      !(await confirmDelete(
        "Delete reply?",
        "Are you sure you want to delete this reply?"
      ))
    ) {
      return;
    }
    replyActions.remove.mutate(reply.id, {
      onSuccess: () => toast.success("Reply deleted"),
    });
  };

  return (
    <div className={styles.comment} data-cy="comment">
      <Entry
        author={comment.author}
        authorId={comment.authorId}
        text={comment.text}
        deleteLabel="Delete comment"
        onDelete={comment.authorId === user._id ? onDeleteComment : undefined}
        meta={
          <>
            <RelativeTime date={comment.date} />
            <button
              className={`${styles.action} ${liked ? styles.liked : ""}`}
              onClick={() =>
                commentActions.like.mutate({ id: comment.id, like: !liked })
              }
            >
              {liked ? "Liked" : "Like"}
            </button>
            <button
              className={styles.action}
              onClick={() => setShowReplies(!showReplies)}
              data-cy="reply-toggle"
            >
              Reply
            </button>
            {comment.likes.length > 0 && (
              <button
                className={styles.likes}
                onClick={() => setShowLikes(true)}
                aria-label="See who liked the comment"
              >
                <AiFillLike className={styles.likeIcon} />
                {nFormatter(comment.likes.length)}
              </button>
            )}
          </>
        }
      />
      <LikesModal
        open={showLikes}
        onClose={() => setShowLikes(false)}
        title="Comment liked by"
        likes={comment.likedBy}
      />
      {repliesCount > 0 && !showReplies && (
        <button
          className={`${styles.action} ${styles.showReplies}`}
          onClick={() => setShowReplies(true)}
        >
          {repliesCount === 1 ? "1 reply" : `${repliesCount} replies`}
        </button>
      )}
      {showReplies && (
        <div className={styles.replies} data-cy="replies">
          {replies ? (
            replies.map((reply) => (
              <Entry
                key={reply.id}
                small
                author={reply.author}
                authorId={reply.authorId}
                text={reply.text}
                deleteLabel="Delete reply"
                onDelete={
                  reply.authorId === user._id
                    ? () => onDeleteReply(reply)
                    : undefined
                }
                meta={<RelativeTime date={reply.date} />}
              />
            ))
          ) : (
            <Skeleton height={40} count={comment.repliesCount || 1} />
          )}
          <CommentForm
            placeholder="Reply to the comment..."
            submitLabel="Add Reply"
            pending={replyActions.create.isPending}
            onSubmit={(text, done) =>
              replyActions.create.mutate(text, { onSuccess: done })
            }
          />
        </div>
      )}
    </div>
  );
}
