import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkId } from "../middleware/errors.js";
import { writeLimiter } from "../middleware/rateLimits.js";
import * as users from "../controllers/userController.js";
import * as friends from "../controllers/friendController.js";
import * as posts from "../controllers/postController.js";

const router = express.Router();

router.use(verifyToken, writeLimiter);

router.get("/search", users.searchUsers);

// the logged in user, declared before /:userId so "me" is not read as an id
router.patch("/me", users.updateProfile);
router.delete("/me", users.deleteAccount);
router.put("/me/picture", users.changePicture);
router.get("/me/suggestions", users.getSuggestions);
router.get("/me/notifications", users.getNotifications);
router.post("/me/notifications/seen", users.markNotificationsSeen);
router.get("/me/friend-requests", friends.getFriendRequests);
router.post(
  "/me/friend-requests/:userId/accept",
  checkId,
  friends.acceptFriendRequest
);
router.delete(
  "/me/friend-requests/:userId",
  checkId,
  friends.declineFriendRequest
);
router.delete("/me/friends/:userId", checkId, friends.removeFriend);

// any user
router.get("/:userId", checkId, users.getUser);
router.get("/:userId/friends", checkId, users.getFriends);
router.get("/:userId/posts", checkId, posts.getUserPosts);
router.post("/:userId/friend-request", checkId, friends.sendFriendRequest);
router.delete("/:userId/friend-request", checkId, friends.cancelFriendRequest);

export default router;
