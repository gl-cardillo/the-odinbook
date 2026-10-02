import "./post.css";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { LikeAndComment } from "../LikeAndComment/LikeAndComment";
import { getTime, deletePost, swalStyle, handleSuccess } from "../../utils/utils";
import { MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import type { Post as PostType, SetRender } from "../../types";

interface PostProps {
  post: PostType;
  setRender: SetRender;
}

export function Post({ post, setRender }: PostProps) {
  const { user } = useCurrentUser();

  const confirmDelete = () => {
    Swal.fire({
      title: "Are you sure you want to delete this post?",
      position: "top",
      showCancelButton: true,
      confirmButtonText: "Close",
      cancelButtonText: "Delete",
      ...swalStyle,
    }).then((result) => {
      if (result.isDismissed) {
        deletePost(post, setRender);
        Swal.close();
        handleSuccess("Post deleted successfully");
      } else {
        Swal.close();
      }
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
              <button className="delete-button" onClick={confirmDelete}>
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
