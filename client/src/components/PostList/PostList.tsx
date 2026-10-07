import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import { BsFileEarmarkText } from "react-icons/bs";
import { Post } from "../Post/Post";
import { Button, Card, EmptyState } from "../ui";
import type { Post as PostType } from "../../types";
import styles from "./PostList.module.scss";

interface PostListProps {
  query: UseInfiniteQueryResult<InfiniteData<PostType[]>>;
  emptyText: string;
}

// a paged list of posts with a "Load more" button
export function PostList({ query, emptyText }: PostListProps) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = query;

  if (!data) {
    return (
      <div className={styles.list}>
        <Skeleton height={300} count={3} className={styles.skeleton} />
      </div>
    );
  }

  const posts = data.pages.flat();
  if (posts.length === 0) {
    return (
      <Card>
        <EmptyState icon={<BsFileEarmarkText />} title={emptyText} />
      </Card>
    );
  }

  return (
    <div className={styles.list}>
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {hasNextPage && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load more posts"}
        </Button>
      )}
    </div>
  );
}
