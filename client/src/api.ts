import axios from "axios";
import type {
  AuthResponse,
  Comment,
  NotificationsResponse,
  Post,
  Reply,
  User,
  UserSummary,
} from "./types";

// every call to the server goes through here

const get = <T>(url: string, params?: Record<string, unknown>) =>
  axios.get<T>(url, { params }).then((res) => res.data);

export const PAGE_SIZE = 10;

// the same limits the server enforces
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 2000;

export interface ProfileUpdate {
  firstname: string;
  lastname: string;
  gender?: string;
  dateOfBirth?: Date;
  hometown?: string;
  worksAt?: string;
  school?: string;
  relationship?: string;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    axios
      .post<AuthResponse>("/auth/login", { email, password })
      .then((res) => res.data),
  signup: (data: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
  }) => axios.post<AuthResponse>("/auth/signup", data).then((res) => res.data),

  // users
  user: (id: string) => get<User>(`/users/${id}`),
  searchUsers: (q: string) => get<UserSummary[]>("/users/search", { q }),
  suggestions: (limit?: number) =>
    get<User[]>("/users/me/suggestions", { limit }),
  friends: (id: string, limit?: number) =>
    get<UserSummary[]>(`/users/${id}/friends`, { limit }),
  friendRequests: (limit?: number) =>
    get<UserSummary[]>("/users/me/friend-requests", { limit }),
  notifications: () => get<NotificationsResponse>("/users/me/notifications"),
  markNotificationsSeen: () => axios.post("/users/me/notifications/seen"),
  updateProfile: (data: ProfileUpdate) =>
    axios.patch<User>("/users/me", data).then((res) => res.data),
  changePicture: (kind: "profile" | "cover", url: string) =>
    axios.put<User>("/users/me/picture", { kind, url }).then((res) => res.data),
  deleteAccount: () => axios.delete("/users/me"),

  // friends
  sendFriendRequest: (id: string) => axios.post(`/users/${id}/friend-request`),
  cancelFriendRequest: (id: string) =>
    axios.delete(`/users/${id}/friend-request`),
  acceptFriendRequest: (id: string) =>
    axios.post(`/users/me/friend-requests/${id}/accept`),
  declineFriendRequest: (id: string) =>
    axios.delete(`/users/me/friend-requests/${id}`),
  removeFriend: (id: string) => axios.delete(`/users/me/friends/${id}`),

  // posts, pages of PAGE_SIZE older than the post id in before
  feed: (before?: string) =>
    get<Post[]>("/posts/feed", { before, limit: PAGE_SIZE }),
  userPosts: (id: string, before?: string) =>
    get<Post[]>(`/users/${id}/posts`, { before, limit: PAGE_SIZE }),
  post: (id: string) => get<Post>(`/posts/${id}`),
  createPost: (text: string, picUrl?: string) =>
    axios.post<Post>("/posts", { text, picUrl }).then((res) => res.data),
  deletePost: (id: string) => axios.delete(`/posts/${id}`),
  likePost: (id: string, like: boolean) =>
    axios
      .request<UserSummary[]>({
        method: like ? "put" : "delete",
        url: `/posts/${id}/like`,
      })
      .then((res) => res.data),

  // comments and replies
  comments: (postId: string) => get<Comment[]>(`/posts/${postId}/comments`),
  createComment: (postId: string, text: string) =>
    axios.post<Comment>(`/posts/${postId}/comments`, { text }),
  deleteComment: (id: string) => axios.delete(`/comments/${id}`),
  likeComment: (id: string, like: boolean) =>
    axios.request({
      method: like ? "put" : "delete",
      url: `/comments/${id}/like`,
    }),
  replies: (commentId: string) => get<Reply[]>(`/comments/${commentId}/replies`),
  createReply: (commentId: string, text: string) =>
    axios.post(`/comments/${commentId}/replies`, { text }),
  deleteReply: (commentId: string, date: string | number) =>
    axios.delete(`/comments/${commentId}/replies/${new Date(date).getTime()}`),

  // uploads the image straight to the bucket and returns where it can be read
  uploadImage: async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Images can be at most 5 MB");
    }
    const { data } = await axios.post<{
      url: string;
      fields: Record<string, string>;
      fileUrl: string;
    }>("/uploads", { type: file.type });

    // the signed fields first, the file last, as S3 expects
    const form = new FormData();
    Object.entries(data.fields).forEach(([name, value]) =>
      form.append(name, value)
    );
    form.append("file", file);
    // the bucket must not receive the login token
    await axios.post(data.url, form, { headers: { Authorization: null } });
    return data.fileUrl;
  },
};
