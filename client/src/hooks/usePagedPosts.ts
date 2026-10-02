import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, handleError } from "../utils/utils";
import type { Post } from "../types";

const PAGE_SIZE = 10;

// loads a list of posts 10 at a time, starting again when url or render change
export function usePagedPosts(url: string, render: number) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    (before?: string) =>
      axios.get<Post[]>(url, { params: { limit: PAGE_SIZE, before } }),
    [url]
  );

  useEffect(() => {
    let ignore = false;
    fetchPage()
      .then((res) => {
        if (ignore) return;
        setPosts(res.data);
        setHasMore(res.data.length === PAGE_SIZE);
      })
      .catch((err) => {
        if (!ignore) handleError(errorMessage(err));
      });
    return () => {
      ignore = true;
    };
  }, [fetchPage, render]);

  const loadMore = async () => {
    if (!posts || posts.length === 0) return;
    setLoadingMore(true);
    try {
      const res = await fetchPage(posts[posts.length - 1].id);
      setPosts([...posts, ...res.data]);
      setHasMore(res.data.length === PAGE_SIZE);
    } catch (err) {
      handleError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  return { posts, hasMore, loadingMore, loadMore };
}
