import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import { deleteFile, fileUrl } from "../config/s3.js";
import Upload from "../models/upload.js";
import { claimUpload, forgetUpload } from "./uploadController.js";
import { body } from "express-validator";
import type { Request, Response } from "express";
import { currentUserId } from "../middleware/verifyToken.js";
import { TEST_ACCOUNT_EMAIL } from "../config/env.js";
import { forbidden, notFound, validate } from "../middleware/errors.js";
import { nameRule } from "./authController.js";
import { userSummaries } from "./details.js";
import Notification from "../models/notification.js";
import Reply from "../models/reply.js";
import { listNotifications } from "./notify.js";

type UserDoc = InstanceType<typeof User>;

// what other users can see, the email stays private
const publicUser = (user: UserDoc, viewerId: string) => {
  const data = user.toJSON() as Record<string, unknown>;
  if (user.id !== viewerId) {
    delete data.email;
  }
  return data;
};

// ?limit= for the short lists in the side menu
const listLimit = (req: Request, max: number) =>
  Math.min(Math.max(Number(req.query.limit) || max, 1), max);

export const findUser = async (id: string, fields?: string) => {
  const user = await User.findById(id, fields);
  if (!user) throw notFound("User");
  return user;
};

// typed text is matched literally, not as a regular expression
const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchUsers = async (req: Request, res: Response) => {
  const words = String(req.query.q ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  if (words.length === 0) {
    res.json([]);
    return;
  }
  // every word has to match the first or the last name
  const users = await User.find(
    {
      _id: { $ne: currentUserId(req) },
      $and: words.map((word) => {
        const pattern = new RegExp(escapeRegex(word), "i");
        return { $or: [{ firstname: pattern }, { lastname: pattern }] };
      }),
    },
    "firstname lastname profilePicUrl"
  ).limit(10);
  res.json(
    users.map((user) => ({
      id: user.id,
      fullname: user.fullname,
      profilePicUrl: user.profilePicUrl,
    }))
  );
};

export const getUser = async (req: Request, res: Response) => {
  const user = await findUser(String(req.params.userId));
  res.json(publicUser(user, currentUserId(req)));
};

export const getSuggestions = async (req: Request, res: Response) => {
  const me = await findUser(currentUserId(req), "friends");
  // not yourself and not your friends
  const profiles = await User.find({
    _id: { $nin: [...me.friends, me.id] },
  }).limit(listLimit(req, 30));
  res.json(profiles.map((profile) => publicUser(profile, me.id)));
};

export const getFriends = async (req: Request, res: Response) => {
  const user = await findUser(String(req.params.userId), "friends");
  const friends = await userSummaries(user.friends);
  res.json(friends.slice(0, listLimit(req, friends.length || 1)));
};

// the latest 50 notifications and how many are not seen yet
export const getNotifications = async (req: Request, res: Response) => {
  res.json(await listNotifications(currentUserId(req)));
};

export const markNotificationsSeen = async (req: Request, res: Response) => {
  await Notification.updateMany(
    { recipientId: currentUserId(req), seen: false },
    { seen: true }
  );
  res.sendStatus(204);
};

export const updateProfile = [
  ...validate(
    nameRule("firstname", "First name"),
    nameRule("lastname", "Last name"),
    body("hometown").optional().trim().isLength({ max: 30 }),
    body("worksAt").optional().trim().isLength({ max: 30 }),
    body("school").optional().trim().isLength({ max: 30 }),
    body("relationship").optional().trim(),
    body("gender").optional().trim(),
    body("dateOfBirth", "Invalid date of birth")
      .optional({ values: "falsy" })
      .isISO8601()
  ),
  async (req: Request, res: Response) => {
    const {
      firstname,
      lastname,
      gender,
      dateOfBirth,
      hometown,
      worksAt,
      school,
      relationship,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      currentUserId(req),
      {
        firstname,
        lastname,
        gender,
        dateOfBirth,
        hometown,
        worksAt,
        school,
        relationship,
      },
      { new: true, runValidators: true }
    );
    if (!user) throw notFound("User");
    res.json(user);
  },
];

export const changePicture = [
  ...validate(
    body("kind", "kind must be profile or cover").isIn(["profile", "cover"])
  ),
  async (req: Request, res: Response) => {
    const { kind } = req.body;
    const field = kind === "profile" ? "profilePicUrl" : "coverPicUrl";
    const user = await findUser(currentUserId(req));
    const url = await claimUpload(user.id, req.body.url);

    // the replaced picture is not used anywhere else
    const previous = user[field];
    user[field] = url;
    await user.save();
    deleteFile(previous);
    await forgetUpload(previous);

    res.json(user);
  },
];

export const deleteAccount = async (req: Request, res: Response) => {
  const id = currentUserId(req);
  const account = await findUser(id);
  if (account.email === TEST_ACCOUNT_EMAIL) {
    throw forbidden("The guest account cannot be deleted");
  }

  const posts = await Post.find({ authorId: id }, "picUrl");
  const postIds = posts.map((post) => post.id);
  await account.deleteOne();

  // every picture uploaded by the account, used or not
  deleteFile(account.profilePicUrl);
  deleteFile(account.coverPicUrl);
  posts.forEach((post) => deleteFile(post.picUrl));
  const uploads = await Upload.find({ userId: id, used: false });
  uploads.forEach((upload) => deleteFile(fileUrl(upload.key)));
  await Upload.deleteMany({ userId: id });

  // the posts with everything under them, even from other users
  await Post.deleteMany({ authorId: id });
  await Comment.deleteMany({ postId: { $in: postIds } });
  await Reply.deleteMany({ postId: { $in: postIds } });
  await Notification.deleteMany({ postId: { $in: postIds } });

  // what the account wrote or did elsewhere
  const comments = await Comment.find({ authorId: id }, "_id");
  const commentIds = comments.map((comment) => comment.id);
  await Comment.deleteMany({ authorId: id });
  await Reply.deleteMany({
    $or: [{ authorId: id }, { commentId: { $in: commentIds } }],
  });
  await Post.updateMany({ likes: id }, { $pull: { likes: id } });
  await Comment.updateMany({ likes: id }, { $pull: { likes: id } });
  await User.updateMany(
    { $or: [{ friends: id }, { friendRequests: id }] },
    { $pull: { friendRequests: id, friends: id } }
  );
  await Notification.deleteMany({
    $or: [
      { recipientId: id },
      { actorId: id },
      { commentId: { $in: commentIds } },
    ],
  });

  res.sendStatus(204);
};
