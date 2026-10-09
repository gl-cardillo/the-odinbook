import styles from "./Post.module.scss";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { LikeAndComment } from "../LikeAndComment/LikeAndComment";
import { Avatar, confirmDelete, RelativeTime, toast } from "../ui";
import { useDeletePost } from "../../queries";
import { MdDelete } from "react-icons/md";
import type { Post as PostType } from "../../types";

export function Post({ post }: { post: PostType }) {
  const { user } = useCurrentUser();
  const deletePost = useDeletePost();
  const name = post.author ? post.author.fullname : "";

  const onDelete = async () => {
    if (
      !(await confirmDelete(
        "Delete post?",
        "Are you sure you want to delete this post?"
      ))
    ) {
      return;
    }
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success("Post deleted successfully"),
    });
  };

  return (
    <article className={styles.card} data-cy="post">
      <header className={styles.header}>
        <Link to={`/profile/${post.authorId}`} tabIndex={-1}>
          <Avatar src={post.author?.profilePicUrl} name={name} alt="" />
        </Link>
        <div className={styles.authorTime}>
          <Link to={`/profile/${post.authorId}`} className={styles.author}>
            {name || "Deleted user"}
          </Link>
          <p className={styles.time}>
            <RelativeTime date={post.date} />
          </p>
        </div>
        {post.authorId === user._id && (
          <button
            className={styles.deleteButton}
            onClick={onDelete}
            disabled={deletePost.isPending}
            aria-label="Delete post"
            data-cy="delete-post"
          >
            <MdDelete />
          </button>
        )}
      </header>
      <p className={styles.message}>{post.text}</p>
      {post.picUrl && <img className={styles.image} src={post.picUrl} alt="" />}
      <div className={styles.footer}>
        <LikeAndComment post={post} />
      </div>
    </article>
  );
}
