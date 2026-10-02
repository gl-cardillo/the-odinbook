import Post from "../models/post.js";
import Comment from "../models/comment.js";
import User from "../models/user.js";
import { body, validationResult } from "express-validator";
import { deleteFile, isBucketUrl } from "../config/s3.js";
import type { Request, Response } from "express";
import { currentUserId } from "../middleware/verifyToken.js";
import { pageQuery, userSummaries, withPostDetails } from "./details.js";

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const posts = await pageQuery(
      Post,
      { authorId: req.params.userId },
      req.query
    );
    return res.status(200).json(await withPostDetails(posts));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "No post found" });
    }
    const [detailed] = await withPostDetails([post]);
    return res.status(200).json(detailed);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await pageQuery(Post, {}, req.query);
    return res.status(200).json(await withPostDetails(posts));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getFriendsPost = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId, "friends");
    if (!user) {
      return res.status(404).json({ message: "No users found" });
    }
    //show the posts of the user as well as the friends
    const authors = [...user.friends, req.params.userId as string];

    const posts = await pageQuery(
      Post,
      { authorId: { $in: authors } },
      req.query
    );
    return res.status(200).json(await withPostDetails(posts));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getWhoLiked = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId, "likes");
    if (!post) {
      return res.status(404).json({ message: "No posts found" });
    }
    return res.status(200).json(await userSummaries(post.likes));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const createPost = [
  body("text").trim().isLength({ min: 1 }),

  async (req: Request, res: Response) => {
    const { text, picUrl } = req.body;
    const authorId = currentUserId(req);
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res.status(400).json({ message: "Text is required" });
    }
    if (picUrl && !isBucketUrl(picUrl)) {
      return res.status(400).json({ message: "Invalid picture url" });
    }
    try {
      const post = await Post.create({ text, authorId, picUrl });
      const [detailed] = await withPostDetails([post]);
      return res.status(200).json({ post: detailed });
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
];

export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.body.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.authorId !== currentUserId(req)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    await post.deleteOne();

    //check if there is an image in the post
    if (post.picUrl) {
      deleteFile(post.picUrl);
    }

    // delete the comments of the post and the notifications about it
    await Comment.deleteMany({ postId: post.id });
    await User.updateMany(
      { "notifications.elementId": post.id },
      { $pull: { notifications: { elementId: post.id } } }
    );

    return res.status(200).json({
      message: `Post with id ${post.id} deleted with comments`,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const addLike = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.body;
    const userId = currentUserId(req);
    const post = await Post.findById(elementId, "authorId likes");
    if (!post) {
      return res.status(404).json({ message: "No post found" });
    }

    // the same request likes and unlikes
    if (post.likes.includes(userId)) {
      await Post.updateOne({ _id: elementId }, { $pull: { likes: userId } });
      return res.status(200).json({
        message: `User with id ${userId} removed the like from post with id ${elementId}`,
      });
    }

    await Post.updateOne({ _id: elementId }, { $addToSet: { likes: userId } });

    //if the user who liked the post is not the author send a notification
    if (userId !== post.authorId) {
      await User.updateOne(
        { _id: post.authorId },
        {
          $push: {
            notifications: {
              userId,
              message: `liked your post`,
              date: Date.now(),
              seen: false,
              elementId,
              link: `/singlePost/${elementId}`,
            },
          },
        }
      );
    }

    return res.status(200).json({
      message: `User with id ${userId} added a like from post with id ${elementId}`,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getAuthor = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId, "firstname lastname");
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.status(200).json(user.fullname);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};
