import { useState, useEffect } from "react";
import { FaRegComment, FaComment } from "react-icons/fa";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import Skeleton from "react-loading-skeleton";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Comment } from "../Comment/Comment";
import { CommentForm } from "../Comment/CommentForm";
import { LikesModal } from "./LikesModal";
import { nFormatter } from "../../utils/utils";
import { useCommentActions, useComments, useLikePost } from "../../queries";
import type { Post, UserSummary } from "../../types";
import styles from "./LikeAndComment.module.scss";

export function LikeAndComment({ post }: { post: Post }) {
  const [expandComments, setExpandComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  // likes come with the post, a like answers with the new list
  const [likes, setLikes] = useState<UserSummary[]>(post.likedBy);
  const { user } = useCurrentUser();

  const { data: comments } = useComments(post.id, expandComments);
  const { create } = useCommentActions(post.id);
  const likePost = useLikePost(post.id);
  const commentsCount = comments?.length ?? post.commentsCount;
  const liked = likes.some((profile) => profile.id === user.id);

  useEffect(() => {
    setLikes(post.likedBy);
  }, [post.likedBy]);

  const toggleLike = () =>
    likePost.mutate(!liked, { onSuccess: (newLikes) => setLikes(newLikes) });

  return (
    <div>
      {(likes.length > 0 || commentsCount > 0) && (
        <div className={styles.stats}>
          {likes.length > 0 && (
            <button
              className={styles.stat}
              onClick={() => setShowLikes(true)}
              data-cy="like-count"
            >
              <AiFillLike className={styles.likeIcon} />
              {likes[0].fullname}
              {likes.length > 1 &&
                ` and ${nFormatter(likes.length - 1)} other${likes.length > 2 ? "s" : ""}`}
            </button>
          )}
          {commentsCount > 0 && (
            <button
              className={`${styles.stat} ${styles.commentsCount}`}
              onClick={() => setExpandComments(!expandComments)}
            >
              {commentsCount > 1
                ? `${nFormatter(commentsCount)} comments`
                : "1 comment"}
            </button>
          )}
        </div>
      )}
      <LikesModal
        open={showLikes}
        onClose={() => setShowLikes(false)}
        title="Post liked by"
        likes={likes}
      />
      <div className={styles.actions}>
        <button
          className={`${styles.action} ${liked ? styles.active : ""}`}
          onClick={toggleLike}
          disabled={likePost.isPending}
          aria-pressed={liked}
        >
          {liked ? <AiFillLike /> : <AiOutlineLike />}
          Like
        </button>
        <button
          className={`${styles.action} ${expandComments ? styles.active : ""}`}
          onClick={() => setExpandComments(!expandComments)}
          aria-expanded={expandComments}
        >
          {expandComments ? <FaComment /> : <FaRegComment />}
          Comment
        </button>
      </div>
      {expandComments && (
        <div className={styles.comments}>
          {comments ? (
            comments.map((comment) => (
              <Comment key={comment.id} comment={comment} postId={post.id} />
            ))
          ) : (
            <Skeleton height={48} count={Math.min(commentsCount, 3) || 1} />
          )}
          <CommentForm
            placeholder="Write a comment..."
            submitLabel="Add Comment"
            pending={create.isPending}
            onSubmit={(text, done) => create.mutate(text, { onSuccess: done })}
          />
        </div>
      )}
    </div>
  );
}
