import "./post.css";
import axios from "axios";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { LikeAndComment } from "../LikeAndComment/LikeAndComment";
import { getTime } from "../../utils/utils";
import { deletePost } from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import {
  swalStyle,
  handleSuccess,
  handleError,
  errorMessage,
} from "../../utils/utils";
import type { Post as PostType, SetRender } from "../../types";

interface PostProps {
  post: PostType;
  setRender: SetRender;
  render: number;
}

export function Post({ post, setRender, render }: PostProps) {
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const { user } = useCurrentUser();

  useEffect(() => {
    const getData = async () => {
      try {
        const [pic, authorName] = await Promise.all([
          axios.get<string>(`/user/profilePic/${post.authorId}`),
          axios.get<string>(`/posts/getAuthor/${post.authorId}`),
        ]);
        setProfilePicUrl(pic.data);
        setAuthor(authorName.data);
      } catch (err) {
        handleError(errorMessage(err));
      }
    };
    getData();
  }, [post.authorId, render]);

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
            {profilePicUrl ? (
              <img className="avatar-pic" src={profilePicUrl} alt="avatar" />
            ) : (
              <Skeleton height={50} width={50} circle={true} />
            )}
          </Link>
          <div className="author-time">
            <Link to={`/profile/${post.authorId}`}>
              <p className="author">
                {author ? author : <Skeleton height={20} width={100} />}
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
        <img className="post-image" src={post.picUrl} />
        <LikeAndComment post={post} authorPostId={post.authorId} />
      </div>
    </div>
  );
}
