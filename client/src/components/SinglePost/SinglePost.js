import axios from "axios";
import { useState, useEffect, useContext } from "react";

import { SideMenu } from "../SideMenu/SideMenu";
import { Post } from "../Post/Post";
import { useLocation, useParams } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { handleError } from "../../utils/utils";

export function SinglePost({}) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [render, setRender] = useState(0);

  useEffect(() => {
    const getData = async () => {
      await axios
        .get(`${process.env.REACT_APP_API_URL}/posts/byPostId/${postId}`)
        .then((res) => {
          setPost(res.data);
        })
        .catch((err) => {
          console.log(err);
          handleError(err.message);
        });
    };
    getData();
  }, [postId, render]);

  return (
    <div className="main-page">
      <div className="containers">
        {post ? (
          <Post post={post} setRender={setRender} render={render} />
        ) : (
          <Skeleton height={400} />
        )}
      </div>
      <SideMenu />
    </div>
  );
}
