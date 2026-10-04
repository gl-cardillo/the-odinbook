// what the API sends back, the server is checked against these when it
// answers and the client reads them

import type { NOTIFICATION_TYPES } from "./limits.js";

// a user as anyone logged in can see them, the email only on your own
export interface User {
  _id: string;
  id: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email?: string;
  profilePicUrl?: string;
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

// the little a list needs to show someone: name, picture and a link
export interface UserSummary {
  id: string;
  fullname: string;
  profilePicUrl?: string;
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
  postId: string;
  authorId: string;
  // null when the author deleted the account
  author: UserSummary | null;
  text: string;
  date: string;
}

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

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

// a form to post one image straight to the bucket
export interface UploadForm {
  url: string;
  fields: Record<string, string>;
  // where the image can be read once uploaded
  fileUrl: string;
  maxBytes: number;
}

// every error answer
export interface ApiError {
  message: string;
}
