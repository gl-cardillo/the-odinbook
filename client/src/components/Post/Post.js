import "./post.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { Link } from "react-router-dom";
import { LikeAndComment } from "../LikeAndComment/LikeAndComment";
import { AiOutlineClose } from "react-icons/ai";
import { getTime } from "../../utils/utils";
import { deletePost } from "../../utils/utils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import { swalStyle, handleSuccess, handleError } from "../../utils/utils";

export function Post({ post, setRender, render }) {
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [author, setAuthor] = useState("");
  const { user } = useContext(UserContext);

  useEffect(() => {
    const getData = async () => {
      try {
        const requests = [
          axios.get(
            `${process.env.REACT_APP_API_URL}/user/profilePic/${post.authorId}`
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/posts/getAuthor/${post.authorId}`
          ),
        ];

        const results = await Promise.all(requests);
        setProfilePicUrl(results[0].data);
        setAuthor(results[1].data);
      } catch (err) {
        handleError(err?.response?.data?.message);
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
        deletePost(post, setRender, render);
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
          <Link to={`/profile/${post.userId}`}>
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
