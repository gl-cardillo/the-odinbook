// limits the server enforces and the client shows in its forms

export const MAX_POST_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 2000;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = [
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
];

// posts per page in the feed and on profiles
export const PAGE_SIZE = 10;

export const NOTIFICATION_TYPES = [
  "friend_request",
  "friend_accept",
  "post_like",
  "post_comment",
  "comment_like",
  "comment_reply",
] as const;
