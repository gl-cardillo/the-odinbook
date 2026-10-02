import User from "../models/user.js";
import type { Request, Response } from "express";
import { currentUserId } from "../middleware/verifyToken.js";
import { badRequest, notFound } from "../middleware/errors.js";
import { notify, removeNotifications } from "./notify.js";
import { findUser } from "./userController.js";
import { userSummaries } from "./details.js";

const REQUEST_MESSAGE = "sent you a friend request";

// requests the logged in user received
export const getFriendRequests = async (req: Request, res: Response) => {
  const me = await findUser(currentUserId(req), "friendRequests");
  const requests = await userSummaries(me.friendRequests);
  const limit = Number(req.query.limit) || requests.length;
  res.json(requests.slice(0, limit));
};

// POST /users/:userId/friend-request
export const sendFriendRequest = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const profileId = String(req.params.userId);
  if (profileId === me) {
    throw badRequest("User can send request only to other user");
  }
  const profile = await findUser(profileId, "friends friendRequests");
  if (profile.friendRequests.includes(me)) {
    throw badRequest("Request already pending");
  }
  if (profile.friends.includes(me)) {
    throw badRequest("User cannot send friend request to friend");
  }

  await User.updateOne(
    { _id: profileId },
    { $addToSet: { friendRequests: me } }
  );
  await notify(profileId, me, {
    message: REQUEST_MESSAGE,
    link: "/friendRequests",
  });
  res.sendStatus(204);
};

// DELETE /users/:userId/friend-request, takes back a request you sent
export const cancelFriendRequest = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const profileId = String(req.params.userId);
  const result = await User.updateOne(
    { _id: profileId, friendRequests: me },
    { $pull: { friendRequests: me } }
  );
  if (result.matchedCount === 0) throw notFound("Request");
  await removeNotifications(profileId, { userId: me, message: REQUEST_MESSAGE });
  res.sendStatus(204);
};

// POST /users/me/friend-requests/:userId/accept
export const acceptFriendRequest = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const profileId = String(req.params.userId);
  const result = await User.updateOne(
    { _id: me, friendRequests: profileId },
    {
      $pull: { friendRequests: profileId },
      $addToSet: { friends: profileId },
    }
  );
  if (result.matchedCount === 0) {
    throw badRequest("No request to accept");
  }
  await User.updateOne({ _id: profileId }, { $addToSet: { friends: me } });

  await removeNotifications(me, { userId: profileId, message: REQUEST_MESSAGE });
  await notify(profileId, me, {
    message: "accepted your friend request",
    link: `/profile/${me}`,
  });
  res.sendStatus(204);
};

// DELETE /users/me/friend-requests/:userId
export const declineFriendRequest = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const profileId = String(req.params.userId);
  const result = await User.updateOne(
    { _id: me, friendRequests: profileId },
    { $pull: { friendRequests: profileId } }
  );
  if (result.matchedCount === 0) {
    throw badRequest("No request to decline");
  }
  await removeNotifications(me, { userId: profileId, message: REQUEST_MESSAGE });
  res.sendStatus(204);
};

// DELETE /users/me/friends/:userId
export const removeFriend = async (req: Request, res: Response) => {
  const me = currentUserId(req);
  const profileId = String(req.params.userId);
  const result = await User.updateOne(
    { _id: me, friends: profileId },
    { $pull: { friends: profileId } }
  );
  if (result.matchedCount === 0) {
    throw notFound("Friendship");
  }
  await User.updateOne({ _id: profileId }, { $pull: { friends: me } });
  res.sendStatus(204);
};
