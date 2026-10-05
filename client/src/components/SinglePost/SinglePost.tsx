import { useParams } from "react-router";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { Post } from "../Post/Post";
import { usePost } from "../../queries";

export function SinglePost() {
  const { postId = "" } = useParams();
  const { data: post, isError } = usePost(postId);

  return (
    <PageLayout aside={<SideMenu />}>
      <div className="containers">
        {post ? (
          <Post post={post} />
        ) : isError ? (
          <div className="post no-data-available-container">
            <p>This post is no longer available</p>
          </div>
        ) : (
          <Skeleton height={400} />
        )}
      </div>
    </PageLayout>
  );
}
