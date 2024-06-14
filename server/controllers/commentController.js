const Comment = require("../models/comment");
const User = require("../models/user");
const Post = require("../models/post");
const { body, validationResult } = require("express-validator");

exports.getCommentsByPostId = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId });
    if (comments.length < 1) {
      return res.status(200).json([]);
    }
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getReplyByCommentsId = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.reply.length < 1) {
      return res.status(200).json([]);
    }

    let replyList = [];

    for (let i = 0; i < comment.reply.length; i++) {
      const user = await User.findById(comment.reply[i].authorId);

      const reply = {
        authorId: comment.reply[i].authorId,
        text: comment.reply[i].text,
        profilePicUrl: user.profilePicUrl,
        authorFullname: user.fullname,
        date: comment.reply[i].date,
      };
      replyList.push(reply);
    }
    return res.status(200).json(replyList);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createComment = [
  body("text").trim().isLength(1),
  async (req, res, next) => {
    const { text, postId, authorId, authorPostId } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    try {
      const comment = await new Comment({
        text,
        postId,
        authorId,
      });
      //if the user who post the comment is not the same as the user who create post
      //send a notification
      if (authorId !== authorPostId) {
        const sendNotification = await User.findByIdAndUpdate(authorPostId, {
          $push: {
            notifications: {
              userId: authorId,
              message: `commented your post`,
              date: Date.now(),
              seen: false,
              elementId: postId,
              link: `/singlePost/${postId}`,
            },
          },
        });
        await sendNotification.save();
      }

      const savedComment = await comment.save();
      if (savedComment) return res.status(200).json(comment);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
];

exports.createReply = [
  body("text").trim().isLength(1),
  async (req, res, next) => {
    const { text, commentId, authorId, authorCommentId, postId } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    try {
      const date = Date.now();
      const reply = await Comment.findByIdAndUpdate(commentId, {
        $push: {
          reply: {
            text,
            commentId,
            authorId,
            date,
          },
        },
      });
      //if the user who post the reply is not the same as the user who create the comment
      //send a notification
      if (authorId !== authorCommentId) {
        const sendNotification = await User.findByIdAndUpdate(authorCommentId, {
          $push: {
            notifications: {
              userId: authorId,
              message: `reply to  your comment`,
              date,
              seen: false,
              elementId: commentId,
              link: `/singlePost/${postId}`,
            },
          },
        });
        await sendNotification.save();
      }

      return res.status(200).json(reply);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
];

exports.deleteComment = async (req, res, next) => {
  try {
    let { id, postId, date } = req.body;
    const deleteComment = await Comment.findByIdAndDelete(id);
    if (!deleteComment) {
      return res.status(400).json({ message: "Comment not found" });
    }
    //Find the authorId
    const post = await Post.findById(postId);

    date = Date.parse(date);
    //remove notifications from made from this user

    const removeNotification = await User.findByIdAndUpdate(post.authorId, {
      $pull: { notifications: { elementId: postId, date: date } },
    });
    if (!removeNotification) {
      return res.status(500).json({ message: "Cannot remove notification" });
    }

    return res
      .status(200)
      .json({ message: `Comment with id ${req.body.id} deleted` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteReply = async (req, res, next) => {
  try {
    let { commentId, authorCommentId, authorReplyId, date } = req.body;
    const replyUpdate = await Comment.findByIdAndUpdate(commentId, {
      $pull: { reply: { authorId: authorReplyId, date } },
    });

    const removeNotification = await User.findByIdAndUpdate(authorCommentId, {
      $pull: { notifications: { elementId: commentId, date: date } },
    });
    if (!removeNotification) {
      return res.status(500).json({ message: "Cannot remove notification" });
    }

    if (!replyUpdate) {
      return res.status(500).json({ message: "Cannot remove reply" });
    }
    return res.status(200).json({ message: "Reply deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.addLike = async (req, res) => {
  try {
    const { elementId, userId, elementAuthorId, postId } = req.body;

    const commentLiked = await Comment.find({
      _id: elementId,
      likes: { $elemMatch: { $eq: userId } },
    });

    //if comment is not liked by the user add like
    if (commentLiked.length == 0) {
      const commentAddLike = await Comment.findByIdAndUpdate(elementId, {
        $push: { likes: userId },
      });

      //if the user who liked the post is not the comment author send a notification
      if (userId !== elementAuthorId) {
        const sendNotification = await User.findByIdAndUpdate(elementAuthorId, {
          $push: {
            notifications: {
              userId,
              message: `liked your comment`,
              date: Date.now(),
              seen: false,
              elementId: postId,
              link: `/singlePost/${postId}`,
            },
          },
        });
        await sendNotification.save();
      }

      if (commentAddLike) {
        return res.status(200).json({
          message: `User with id ${userId} added a like from comment with id ${elementId}`,
        });
      }
      // else remove the like from the array
    } else {
      const commentRemoveLike = await Comment.findByIdAndUpdate(elementId, {
        $pull: { likes: userId },
      });

      if (commentRemoveLike) {
        return res.status(200).json({
          message: `User with id ${userId} removed the like from comment with id ${elementId}`,
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getWhoLiked = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "No comments found" });
    }

    const userList = [];
    //create an array with photo, id and name of the user who
    //liked the comment
    for (let i = 0; i < comment.likes.length; i++) {
      const user = await User.findById(comment.likes[i]);

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
