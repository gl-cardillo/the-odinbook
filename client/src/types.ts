// shapes returned by the API

export interface User {
  _id: string;
  id: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  profilePicUrl: string;
  coverPicUrl?: string;
  friends: string[];
  friendRequests: string[];
  gender?: string;
  hometown?: string;
  dateOfBirth?: string;
  dateOfBirth_formatted?: string;
  dateOfBirth_toISODate?: string | null;
  worksAt?: string;
  school?: string;
  relationship?: string;
}

// minimal user info used in friends, requests and likes lists
export interface UserSummary {
  id: string;
  profilePicUrl: string;
  fullname: string;
}

export interface Post {
  _id: string;
  id: string;
  authorId: string;
  text: string;
  date: string;
  likes: string[];
  picUrl?: string;
  // null when the author deleted the account
  author: UserSummary | null;
  likedBy: UserSummary[];
  commentsCount: number;
}

export interface Comment {
  _id: string;
  id: string;
  authorId: string;
  postId: string;
  text: string;
  date: string;
  likes: string[];
  author: UserSummary | null;
  likedBy: UserSummary[];
  repliesCount: number;
}

export interface Reply {
  id: string;
  commentId: string;
  authorId: string;
  // null when the author deleted the account
  author: UserSummary | null;
  text: string;
  date: string;
}

export type NotificationType =
  | "friend_request"
  | "friend_accept"
  | "post_like"
  | "post_comment"
  | "comment_like"
  | "comment_reply";

export interface Notification {
  id: string;
  type: NotificationType;
  // who did it
  userId: string;
  message: string;
  link: string;
  postId?: string;
  seen: boolean;
  date: string;
  // missing when the sender deleted the account
  profilePicUrl?: string;
  fullname?: string;
}

export interface NotificationsResponse {
  // the latest 50
  notifications: Notification[];
  unseen: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

