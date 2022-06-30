const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const { deleteFile } = require("../config/s3");

exports.getPostsByUserId = async (req, res, next) => {
  try {
    const posts = await Post.find({ authorId: req.params.userId }).sort({
      date: -1,
    });
    if (!posts) {
      return res.status(404).json({ message: "No posts found" });
    }
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "No post found" });
    }
    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({}).sort({ date: -1 });
    if (!posts) {
      return res.status(404).json({ message: "No posts found" });
    }
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getFriendsPost = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No users found" });
    }
    //add user id to the friends array for show the posts of the user as well
    user.friends.push(req.params.userId);

    const posts = await Post.find({ authorId: { $in: user.friends } }).sort({
      date: -1,
    });

    if (!posts) {
      return res.status(404).json({ message: "No posts found" });
    }
    // if there are not posts return an empty array
    if (posts.length < 1) {
      return res.status(200).json([]);
    }
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getLikeByPostId = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "No posts found" });
    }
    return res.status(200).json(post.likes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getWhoLiked = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "No posts found" });
    }

    const userList = [];
    //create an array with photo, id and name of the user who
    //liked the post
    for (let i = 0; i < post.likes.length; i++) {
      const user = await User.findById(post.likes[i]);

      const userData = {
        id: user._id,
        profilePicUrl: user.profilePicUrl,
        fullname: user.fullname,
      };
      userList.push(userData);
    }
    return res.status(200).json(userList);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createPost = [
  body("text").trim().isLength(1),

  async (req, res) => {
    const { text, authorId, picUrl } = req.body;
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res.json({ errs: errs.array() });
    }
    try {
      const post = await new Post({
        text,
        authorId,
        picUrl,
      });

      const savedPost = await post.save();
      if (savedPost) return res.status(200).json({ post });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
];

exports.deletePost = async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.body.id);

    //check if there is an image in the post
    if (deletedPost.picUrl !== "") {
      //if there is dele it
      //comment for testing
      deleteFile(deletedPost.picUrl);
    }

    // delete the comment of the post
    if (deletedPost) {
      const deletedComments = await Comment.deleteMany({
        postId: deletedPost.id,
      });

      //remove notifications from made from this user
      const removeNotification = await User.updateMany(
        {},
        {
          $pull: { notifications: { elementId: req.body.id } },
        }
      );
      if (!removeNotification) {
        return res.status(500).json({ message: "Cannot remove friends" });
      }

      if (deletedComments) {
        return res.status(200).json({
          message: `Post with id ${req.body.id} deleted with comments`,
        });
      } else {
        return res.status(400).json({ message: "Post not found" });
      }
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

exports.addLike = async (req, res) => {
  try {
    const { elementId, userId, elementAuthorId } = req.body;
    const postLiked = await Post.find({
      _id: elementId,
      likes: { $elemMatch: { $eq: userId } },
    });

    //if post is not liked by the user add like
    if (postLiked.length == 0) {
      const postAddLike = await Post.findByIdAndUpdate(elementId, {
        $push: { likes: userId },
      });

      //if the user who liked the post is not the comment author send a notification
      if (userId !== elementAuthorId) {
        const sendNotification = await User.findByIdAndUpdate(elementAuthorId, {
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
        });
        await sendNotification.save();
      }

      if (postAddLike) {
        return res.status(200).json({
          message: `User with id ${userId} added a like from post with id ${elementId}`,
        });
      }
      // else remove the like from the array
    } else {
      const postRemoveLike = await Post.findByIdAndUpdate(elementId, {
        $pull: { likes: userId },
      });

      if (postRemoveLike) {
        return res.status(200).json({
          message: `User with id ${userId} removed the like from post with id ${elementId}`,
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAuthor = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.status(200).json(user.fullname);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
