const Comment = require("../models/comment");
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
    const { text, postId, userId, userFullname } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    try {
      const comment = await new Comment({
        text,
        postId,
        userId,
        userFullname,
      });

      const savedComment = await comment.save();
      if (savedComment)
        return res.status(200).json(comment);
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
