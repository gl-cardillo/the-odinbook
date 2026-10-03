import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Post } from "../Post/Post";
import type { Post as PostType } from "../../types";

interface PostListProps {
  query: UseInfiniteQueryResult<InfiniteData<PostType[]>>;
  emptyText: string;
}

// a paged list of posts with a "Load more" button
export function PostList({ query, emptyText }: PostListProps) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = query;

  if (!data) {
    return <Skeleton height={300} style={{ margin: "10px 0" }} count={3} />;
  }

  const posts = data.pages.flat();
  if (posts.length === 0) {
    return (
      <div className="post no-data-available-container">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {hasNextPage && (
        <button
          className="load-more"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load more posts"}
        </button>
      )}
    </>
  );
}
