import type { Dispatch, SetStateAction } from "react";

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
  reply: { authorId: string; text: string; date: string }[];
  author: UserSummary | null;
  likedBy: UserSummary[];
}

export interface Reply {
  authorId: string;
  authorFullname: string;
  profilePicUrl: string;
  text: string;
  date: string;
}

export interface Notification {
  userId: string;
  message: string;
  date: number;
  seen: boolean;
  link: string;
  elementId?: string;
  // missing when the sender deleted the account
  profilePicUrl?: string;
  fullname?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unchecked: Notification[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type SetRender = Dispatch<SetStateAction<number>>;
