import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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

// a paged list of posts, the next page loads before you reach the end
export function PostList({ query, emptyText }: PostListProps) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = query;
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = end.current;
    if (!marker || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      // about a screen ahead, so scrolling rarely has to wait
      // (the document as root keeps the margin working inside iframes too)
      { root: document, rootMargin: "800px 0px" }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data]);

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
      <div ref={end} aria-hidden />
      {hasNextPage && (
        // still there for keyboard users and browsers that scroll too fast
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
