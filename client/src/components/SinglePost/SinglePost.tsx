import axios from "axios";
import { useState, useEffect } from "react";
import { SideMenu } from "../SideMenu/SideMenu";
import { Post } from "../Post/Post";
import { useParams } from "react-router";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { handleError, errorMessage } from "../../utils/utils";
import type { Post as PostType } from "../../types";

export function SinglePost() {
  const { postId } = useParams();
  const [post, setPost] = useState<PostType | null>(null);
  const [render, setRender] = useState(0);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await axios.get<PostType>(`/posts/byPostId/${postId}`);
        setPost(response.data);
      } catch (err) {
        console.log(err);
        handleError(errorMessage(err));
      }
    };
    getData();
  }, [postId, render]);

  return (
    <div className="main-page">
      <div className="containers">
        {post ? (
          <Post post={post} setRender={setRender} />
        ) : (
          <Skeleton height={400} />
        )}
      </div>
      <SideMenu />
    </div>
  );
}
