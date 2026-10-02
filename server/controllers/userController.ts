import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import {
  generateUploadURL,
  deleteFile,
  isBucketUrl,
  IMAGE_TYPES,
} from "../config/s3.js";
import { body, validationResult } from "express-validator";
import type { Request, Response } from "express";
import { currentUserId } from "../middleware/verifyToken.js";
import { TEST_ACCOUNT_EMAIL } from "../config/env.js";
import { findUserSummaries, userSummaries } from "./details.js";

type UserDoc = InstanceType<typeof User>;

// what other users can see, the email stays private
const publicUser = (user: UserDoc, viewerId: string) => {
  const data = user.toJSON() as Record<string, unknown>;
  if (user.id !== viewerId) {
    delete data.email;
  }
  return data;
};

const notYourAccount = (res: Response) =>
  res.status(403).json({ message: "You can only see your own data" });

export const getUser = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    return res
      .status(200)
      .json(users.map((user) => publicUser(user, currentUserId(req))));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

// typed text is matched literally, not as a regular expression
const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const words = String(req.query.q ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3);
    if (words.length === 0) {
      return res.status(200).json([]);
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
    return res.status(200).json(
      users.map((user) => ({
        id: user.id,
        fullname: user.fullname,
        profilePicUrl: user.profilePicUrl,
      }))
    );
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.profileId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.status(200).json(publicUser(user, currentUserId(req)));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = currentUserId(req);
    const { profileId } = req.body;
    const user = await User.findById(profileId);
    // the sender and receiver are the same user
    if (profileId === userId) {
      return res
        .status(400)
        .json({ message: "User can send request only to other user" });
    }
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    // the request is already been sent
    if (user.friendRequests.includes(userId)) {
      return res.status(400).json({ message: "Request already pending" });
    }
    // the users are already friend
    if (user.friends.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User cannot send friend request to friend" });
    }

    await User.findByIdAndUpdate(profileId, {
      $push: {
        notifications: {
          userId,
          message: `sent you a friend request`,
          date: Date.now(),
          seen: false,
          link: `/friendRequests`,
        },
      },
    });

    user.friendRequests.push(userId);
    await user.save();

    return res.status(200).json({
      message: `User with id ${userId} send friend request to user with id ${profileId}`,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const removeFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = currentUserId(req);
    const { profileId } = req.body;
    const user = await User.findById(profileId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    // if no request is found
    if (!user.friendRequests.includes(userId)) {
      return res.status(400).json({ message: "No request found" });
    }
    //get new list without the friend request
    const newFriendRequestsList = user.friendRequests.filter(
      (id) => id !== userId
    );

    user.friendRequests = newFriendRequestsList;

    await User.findByIdAndUpdate(profileId, {
      $pull: {
        notifications: {
          userId,
          message: `sent you a friend request`,
        },
      },
    });

    await user.save();
    return res.status(204).json({
      message: `User with id ${userId} removed friend request to user with id ${profileId}`,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const friendRequestsByUserId = async (req: Request, res: Response) => {
  try {
    if (req.params.userId !== currentUserId(req)) {
      return notYourAccount(res);
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    return res.status(200).json(await userSummaries(user.friendRequests));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

//show only 3 requests
export const friendRequestsByUserId3 = async (req: Request, res: Response) => {
  try {
    if (req.params.userId !== currentUserId(req)) {
      return notYourAccount(res);
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    const requests = await userSummaries(user.friendRequests);
    return res.status(200).json(requests.slice(0, 3));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const suggestedProfile = async (req: Request, res: Response) => {
  try {
    if (req.params.userId !== currentUserId(req)) {
      return notYourAccount(res);
    }
    //get user friend list
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    // add user id to the list so it doenst appear in the usggested profile
    user.friends.push(req.params.userId as string);
    const profiles = await User.find({ _id: { $nin: user.friends } }).limit(30);
    return res
      .status(200)
      .json(profiles.map((profile) => publicUser(profile, currentUserId(req))));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

//return only 3 suggested profile
export const suggestedProfile3 = async (req: Request, res: Response) => {
  try {
    if (req.params.userId !== currentUserId(req)) {
      return notYourAccount(res);
    }
    //get user friend list
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    // add user id to the list so it doenst appear in the usggested profile
    user.friends.push(req.params.userId as string);
    const profiles = await User.find({ _id: { $nin: user.friends } }).limit(3);
    return res
      .status(200)
      .json(profiles.map((profile) => publicUser(profile, currentUserId(req))));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getFriendsByUserId = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json(await userSummaries(user.friends));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

//show only 3
export const getFriendsByUserId3 = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No users found" });
    }

    const friends = await userSummaries(user.friends);
    return res.status(200).json(friends.slice(0, 3));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = currentUserId(req);
    const { profileId } = req.body;
    //
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    // check if user had the request
    if (!user.friendRequests.includes(profileId)) {
      return res.status(400).json({ message: "No request to accept" });
    }
    // remove id from request list and add id to the friend list
    const newFriendRequestsList = user.friendRequests.filter(
      (id) => id !== profileId
    );
    user.friendRequests = newFriendRequestsList;
    user.friends.push(profileId);
    await user.save();

    //find user that request the friendship and add the id to the friend list
    // no need to remove the id from requst friend list (it's only on the user that receive)
    const profile = await User.findById(profileId);
    if (profile) {
      profile.friends.push(userId);
      await profile.save();
    }

    //remove notification of friend requests from the user
    await User.findByIdAndUpdate(userId, {
      $pull: {
        notifications: {
          userId: profileId,
          message: `sent you a friend request`,
        },
      },
    });
    // add notification the friensdhip is been accepted to the other user
    await User.findByIdAndUpdate(profileId, {
      $push: {
        notifications: {
          userId,
          message: `accepted your friend requests`,
          date: Date.now(),
          seen: false,
          link: `/profile/${userId}`,
        },
      },
    });

    return res.status(200).json({
      message: `Users with id ${userId} accepted friend request of user with id ${profileId}`,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const declineFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = currentUserId(req);
    const { profileId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    // check if user had the request
    if (!user.friendRequests.includes(profileId)) {
      return res.status(400).json({ message: "No request to decline" });
    }
    // remove id from request list
    const newFriendRequestsList = user.friendRequests.filter(
      (id) => id !== profileId
    );
    user.friendRequests = newFriendRequestsList;
    await user.save();

    return res.status(200).json({
      message: `Users with id ${userId} decline friend request of user with id ${profileId}`,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = currentUserId(req);
    const { profileId } = req.body;

    const user = await User.findById(userId);
    // no user if found
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    // check if users are friends
    if (!user.friends.includes(profileId)) {
      return res.status(404).json({ message: "Users are not friend" });
    }

    // remove id from friend list
    const newFriends = user.friends.filter((id) => id !== profileId);
    user.friends = newFriends;
    await user.save();

    const profile = await User.findById(profileId);

    // no user if found
    if (!profile) {
      return res.status(404).json({ message: "No user found" });
    }

    // remove for both user
    const newFriends2 = profile.friends.filter((id) => id !== userId);
    profile.friends = newFriends2;
    await profile.save();

    return res.status(200).json({
      message: `Users with id ${userId} remove friendship with id ${profileId}`,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const id = currentUserId(req);
    const account = await User.findById(id);
    if (!account) {
      return res.status(404).json({ message: "No users found" });
    }
    if (account.email === TEST_ACCOUNT_EMAIL) {
      return res
        .status(403)
        .json({ message: "The guest account cannot be deleted" });
    }
    //delete user
    const deleteUser = await User.findByIdAndDelete(id);

    if (!deleteUser) {
      return res.status(404).json({ message: "No users found" });
    }

    deleteFile(deleteUser.profilePicUrl);
    deleteFile(deleteUser.coverPicUrl);

    // find the post to delte
    const postPicToDelete = await Post.find({ authorId: id });

    for (let i = 0; i < postPicToDelete.length; i++) {
      //check if in any on of them ther is a picture
      if (postPicToDelete[i].picUrl) {
        //if there is dele it
        deleteFile(postPicToDelete[i].picUrl);
      }
    }

    // delete users' post
    const deletePost = await Post.deleteMany({ authorId: id });

    if (!deletePost) {
      return res.status(500).json({ message: "Cannot remove posts" });
    }

    // delete users' comment
    const deleteComments = await Comment.deleteMany({ authorId: id });
    if (!deleteComments) {
      return res.status(500).json({ message: "Cannot remove comments" });
    }
    // delete users' likes
    const removeLikes = await Post.updateMany(
      {},
      {
        $pull: { likes: id },
      }
    );
    if (!removeLikes) {
      return res.status(500).json({ message: "Cannot remove likes" });
    }

    // delete users' friend requests and friends
    const removeFriendRequest = await User.updateMany(
      {},
      {
        $pull: { friendRequests: id, friends: id },
      }
    );
    if (!removeFriendRequest) {
      return res.status(500).json({ message: "Cannot remove friends" });
    }
    //remove notifications from made from this user
    const removeNotification = await User.updateMany(
      {},
      {
        $pull: { notifications: { userId: id } },
      }
    );
    if (!removeNotification) {
      return res.status(500).json({ message: "Cannot remove friends" });
    }

    //remove reply to comments from made from this user
    const removeReply = await Comment.updateMany(
      {},
      {
        $pull: { reply: { authorId: id } },
      }
    );
    if (!removeReply) {
      return res.status(500).json({ message: "Cannot remove reply" });
    }

    return res.status(200).json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const generateUrlS3 = async (req: Request, res: Response) => {
  try {
    const type = req.query.type;
    if (typeof type !== "string" || !IMAGE_TYPES.includes(type)) {
      return res.status(400).json({
        message: "Insert a valid image format (bmp, gif, jpeg, png, tiff, webp)",
      });
    }
    const url = await generateUploadURL(type);
    res.status(200).send(url);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const changePic = async (req: Request, res: Response) => {
  try {
    const { imageUrl, profileOrCover } = req.body;
    if (!isBucketUrl(imageUrl)) {
      return res.status(400).json({ message: "Invalid picture url" });
    }
    const user = await User.findById(currentUserId(req));
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    // check is user is changing the cover or the profile picture and
    // delete the current profile picture and add the new one

    if (profileOrCover === "profilePicUrl") {
      //comment for testing
      // deleteFile(user.profilePicUrl);
      user.profilePicUrl = imageUrl;
    } else {
      //comment for testing
      // deleteFile(user.coverPicUrl);
      user.coverPicUrl = imageUrl;
    }

    await user.save();
    return res.status(200).json({ message: "Profile picture changed" });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const getProfilePic = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.status(200).json(user.profilePicUrl);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const updateProfile = [
  body("firstname", "First name must be 2 to 15 letters or numbers")
    .trim()
    .isLength({ min: 2, max: 15 })
    .isAlphanumeric(),
  body("lastname", "Last name must be 2 to 15 letters or numbers")
    .trim()
    .isLength({ min: 2, max: 15 })
    .isAlphanumeric(),
  body("hometown").trim(),
  body("worksAt").trim(),
  body("relationship").trim(),
  async (req: Request, res: Response) => {
    const id = currentUserId(req);
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    try {
      //const date = dateOfBirth.split("T")[0] + "T00:00:00.000Z"

      const user = await User.findByIdAndUpdate(id, {
        firstname,
        lastname,
        gender,
        dateOfBirth,
        hometown,
        worksAt,
        school,
        relationship,
      });
      if (!user) {
        return res.status(404).json({ message: "No user found" });
      }
      return res.status(200).json({ message: "Profile updated" });
    } catch (err) {
      console.log((err as Error).message);
      return res.status(500).json({ message: (err as Error).message });
    }
  },
];

export const getNofication = async (req: Request, res: Response) => {
  try {
    if (req.params.userId !== currentUserId(req)) {
      return notYourAccount(res);
    }
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    const senders = await findUserSummaries(
      user.notifications.map((notification) => notification.userId)
    );
    // add picture and name of the sender, kept empty if the account was deleted
    const notifications = user.notifications
      .map((notification) => {
        const sender = senders.get(String(notification.userId));
        return {
          ...notification,
          profilePicUrl: sender?.profilePicUrl,
          fullname: sender?.fullname,
        };
      })
      .sort((a, b) => b.date - a.date);

    const unchecked = notifications.filter(
      (notification) => notification.seen === false
    );
    return res.status(200).json({ notifications, unchecked });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};

export const checkNotification = async (req: Request, res: Response) => {
  try {
    // Update all notifications to mark them as seen
    const checkNotification = await User.findByIdAndUpdate(
      currentUserId(req),
      { $set: { "notifications.$[].seen": true } },
      { new: true } // This option returns the updated document
    );

    // Check if the user's notifications were updated
    if (!checkNotification) {
      return res
        .status(404)
        .json({ message: "User not found or no notifications updated" });
    }

    return res
      .status(200)
      .json({ message: "All notifications checked", user: checkNotification });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
};
