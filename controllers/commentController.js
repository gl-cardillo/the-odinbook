const Comment = require("../models/comment");
const User = require("../models/user");
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

exports.createComment = [
  body("text").trim().isLength(1),
  async (req, res, next) => {
    const { text, postId, authorId, authorFullname, authorPostId } = req.body;

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
            notification: {
              message: `${authorFullname} commented your post`,
              time: Date.now(),
              seen: false,
              elementId: postId,
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

exports.deleteComment = async (req, res, next) => {
  try {
    const deleteComment = await Comment.findByIdAndDelete(req.body.id);
    if (deleteComment) {
      return res
        .status(200)
        .json({ message: `Comment with id ${req.body.id} deleted` });
    } else {
      return res.status(400).json({ message: "Comment not found" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.addLike = async (req, res) => {
  try {
    const { elementId, userId, elementAuthorId, userFullname } = req.body;
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
            notification: {
              message: `${userFullname} liked your comment`,
              time: Date.now(),
              seen: false,
              elementId,
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
    console.log(err.message);
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
    console.log(err.message)
    return res.status(500).json({ message: err.message });
  }
};
