import "./post.css";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { LikeAndComment } from "../LikeAndComment/LikeAndComment";
import { getTime, confirmDelete, handleSuccess } from "../../utils/utils";
import { useDeletePost } from "../../queries";
import { MdDelete } from "react-icons/md";
import type { Post as PostType } from "../../types";

export function Post({ post }: { post: PostType }) {
  const { user } = useCurrentUser();
  const deletePost = useDeletePost();

  const onDelete = async () => {
    if (!(await confirmDelete("Are you sure you want to delete this post?"))) {
      return;
    }
    deletePost.mutate(post.id, {
      onSuccess: () => handleSuccess("Post deleted successfully"),
    });
  };

  return (
    <div>
      <div className="post">
        <div className="post-info">
          <Link to={`/profile/${post.authorId}`}>
            <img
              className="avatar-pic"
              src={post.author?.profilePicUrl}
              alt="avatar"
            />
          </Link>
          <div className="author-time">
            <Link to={`/profile/${post.authorId}`}>
              <p className="author">
                {post.author ? post.author.fullname : "Deleted user"}
              </p>
            </Link>
            <p className="time">{getTime(post.date)}</p>
          </div>
          {
            //if author posts is the user show delete button
            post.authorId === user._id && (
              <button
                className="delete-button"
                onClick={onDelete}
                disabled={deletePost.isPending}
              >
                <MdDelete color="red" size={17} />
              </button>
            )
          }
        </div>
        <p className="post-message">{post.text}</p>
        {post.picUrl && (
          <img className="post-image" src={post.picUrl} alt="post picture" />
        )}
        <LikeAndComment post={post} />
      </div>
    </div>
  );
}
