import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import { PAGE_SIZE } from "@odinbook/shared";
import { errorMessage } from "./utils/utils";
import { toast } from "./components/ui/feedbackStore";
import type { Comment, Post, User, UserSummary } from "./types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // data stays fresh for a while, pages don't refetch on every visit
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err) => toast.error(errorMessage(err)),
    },
  },
});

// one place for the cache keys, so a change refreshes every list that shows it
export const keys = {
  user: (id: string) => ["user", id] as const,
  search: (q: string) => ["search", q] as const,
  suggestions: (limit?: number) => ["suggestions", limit] as const,
  friends: (id: string, limit?: number) => ["friends", id, limit] as const,
  friendRequests: (limit?: number) => ["friendRequests", limit] as const,
  notifications: ["notifications"] as const,
  feed: ["posts", "feed"] as const,
  userPosts: (id: string) => ["posts", "user", id] as const,
  post: (id: string) => ["post", id] as const,
  comments: (postId: string) => ["comments", postId] as const,
  replies: (commentId: string) => ["replies", commentId] as const,
};

// queries

export const useUser = (id: string) =>
  useQuery({ queryKey: keys.user(id), queryFn: () => api.user(id) });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: keys.search(q),
    queryFn: () => api.searchUsers(q),
    enabled: q.trim() !== "",
  });

export const useSuggestions = (limit?: number) =>
  useQuery({
    queryKey: keys.suggestions(limit),
    queryFn: () => api.suggestions(limit),
  });

export const useFriends = (id: string, limit?: number) =>
  useQuery({
    queryKey: keys.friends(id, limit),
    queryFn: () => api.friends(id, limit),
  });

export const useFriendRequests = (limit?: number) =>
  useQuery({
    queryKey: keys.friendRequests(limit),
    queryFn: () => api.friendRequests(limit),
  });

export const useNotifications = () =>
  useQuery({
    queryKey: keys.notifications,
    queryFn: api.notifications,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });

const pagedPosts = (
  queryKey: readonly unknown[],
  fetchPage: (before?: string) => Promise<Post[]>
) => ({
  queryKey,
  queryFn: ({ pageParam }: { pageParam?: string }) => fetchPage(pageParam),
  initialPageParam: undefined as string | undefined,
  // a full page means there may be more, older than its last post
  getNextPageParam: (lastPage: Post[]) =>
    lastPage.length === PAGE_SIZE
      ? lastPage[lastPage.length - 1].id
      : undefined,
});

export const useFeed = () => useInfiniteQuery(pagedPosts(keys.feed, api.feed));

export const useUserPosts = (id: string) =>
  useInfiniteQuery(
    pagedPosts(keys.userPosts(id), (before) => api.userPosts(id, before))
  );

export const usePost = (id: string) =>
  useQuery({ queryKey: keys.post(id), queryFn: () => api.post(id) });

export const useComments = (postId: string, enabled: boolean) =>
  useQuery({
    queryKey: keys.comments(postId),
    queryFn: () => api.comments(postId),
    enabled,
  });

export const useReplies = (commentId: string, enabled: boolean) =>
  useQuery({
    queryKey: keys.replies(commentId),
    queryFn: () => api.replies(commentId),
    enabled,
  });

// mutations, each refreshes what it changed

export function useFriendActions() {
  const client = useQueryClient();
  const refresh = () =>
    Promise.all(
      ["user", "friends", "friendRequests", "suggestions", "posts"].map((key) =>
        client.invalidateQueries({ queryKey: [key] })
      )
    );
  const useAction = (fn: (id: string) => Promise<unknown>) =>
    useMutation({ mutationFn: fn, onSuccess: refresh });

  return {
    send: useAction(api.sendFriendRequest),
    cancel: useAction(api.cancelFriendRequest),
    accept: useAction(api.acceptFriendRequest),
    decline: useAction(api.declineFriendRequest),
    remove: useAction(api.removeFriend),
  };
}

const refreshPosts = (client: QueryClient) =>
  Promise.all([
    client.invalidateQueries({ queryKey: ["posts"] }),
    client.invalidateQueries({ queryKey: ["post"] }),
  ]);

export function useCreatePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, file }: { text: string; file: File | null }) => {
      const picUrl = file ? await api.uploadImage(file) : undefined;
      return api.createPost(text, picUrl);
    },
    onSuccess: () => refreshPosts(client),
  });
}

export function useDeletePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => refreshPosts(client),
  });
}

// answers with the new likes, the post shows them without reloading the feed
export const useLikePost = (postId: string) =>
  useMutation({ mutationFn: (like: boolean) => api.likePost(postId, like) });

export function useCommentActions(postId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: keys.comments(postId) });
  return {
    create: useMutation({
      mutationFn: (text: string) => api.createComment(postId, text),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: api.deleteComment, onSuccess: refresh }),
    // the like shows at once, and is taken back if the request fails
    like: useMutation({
      mutationFn: ({
        id,
        like,
      }: {
        id: string;
        like: boolean;
        me: UserSummary;
      }) => api.likeComment(id, like),
      onMutate: async ({ id, like, me }) => {
        const key = keys.comments(postId);
        await client.cancelQueries({ queryKey: key });
        const previous = client.getQueryData<Comment[]>(key);
        client.setQueryData<Comment[]>(key, (comments) =>
          comments?.map((comment) =>
            comment.id !== id
              ? comment
              : like
                ? {
                    ...comment,
                    likes: [...comment.likes, me.id],
                    likedBy: [...comment.likedBy, me],
                  }
                : {
                    ...comment,
                    likes: comment.likes.filter((liker) => liker !== me.id),
                    likedBy: comment.likedBy.filter(
                      (liker) => liker.id !== me.id
                    ),
                  }
          )
        );
        return { previous };
      },
      onError: (_err, _vars, context) =>
        client.setQueryData(keys.comments(postId), context?.previous),
      onSettled: refresh,
    }),
  };
}

export function useReplyActions(commentId: string, postId: string) {
  const client = useQueryClient();
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.replies(commentId) }),
      client.invalidateQueries({ queryKey: keys.comments(postId) }),
    ]);
  return {
    create: useMutation({
      mutationFn: (text: string) => api.createReply(commentId, text),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (replyId: string) => api.deleteReply(commentId, replyId),
      onSuccess: refresh,
    }),
  };
}

export function useUpdateProfile(onSaved: (user: User) => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (user) => {
      client.setQueryData(keys.user(user.id), user);
      onSaved(user);
    },
  });
}

export function useChangePicture(onSaved: (user: User) => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kind,
      file,
    }: {
      kind: "profile" | "cover";
      file: File;
    }) => api.changePicture(kind, await api.uploadImage(file)),
    onSuccess: (user) => {
      client.setQueryData(keys.user(user.id), user);
      onSaved(user);
      // posts show the author picture
      return refreshPosts(client);
    },
  });
}

export function useNotificationsSeen() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationsSeen,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.notifications }),
  });
}

export const useDeleteAccount = () =>
  useMutation({ mutationFn: api.deleteAccount });
