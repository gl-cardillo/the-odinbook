import { useParams } from "react-router";
import Skeleton from "react-loading-skeleton";
import { BsFileEarmarkX } from "react-icons/bs";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { Post } from "../Post/Post";
import { ButtonLink, Card, EmptyState } from "../ui";
import { usePost } from "../../queries";

export function SinglePost() {
  const { postId = "" } = useParams();
  const { data: post, isError } = usePost(postId);

  return (
    <PageLayout aside={<SideMenu />}>
      {post ? (
        <Post post={post} />
      ) : isError ? (
        <Card>
          <EmptyState
            icon={<BsFileEarmarkX />}
            title="This post is no longer available"
          >
            <p>It may have been deleted by its author.</p>
            <ButtonLink to="/home" variant="secondary" size="sm">
              Back to the feed
            </ButtonLink>
          </EmptyState>
        </Card>
      ) : (
        <Skeleton height={400} borderRadius={12} />
      )}
    </PageLayout>
  );
}
