import * as userController from "../controllers/userController.js";
import express from "express";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// every route below needs a logged in user
router.use(verifyToken);

router.get("/", userController.getUser);

router.get("/profile/:profileId", userController.getUserById);

router.get("/get3SuggestedProfile/:userId", userController.suggestedProfile3);

router.get("/getSuggestedProfile/:userId", userController.suggestedProfile);

router.get("/friendRequests/:userId", userController.friendRequestsByUserId);

router.get("/friendRequests3/:userId", userController.friendRequestsByUserId3);

router.get("/friends/:userId", userController.getFriendsByUserId);

router.get("/friends3/:userId", userController.getFriendsByUserId3);

router.get("/profilePic/:userId", userController.getProfilePic);

router.get("/generateUrlS3", userController.generateUrlS3);

router.get("/getNotification/:userId", userController.getNofication);

router.put("/checkNotification", userController.checkNotification);

router.put("/changePic", userController.changePic);

router.put("/sendFriendRequest", userController.sendFriendRequest);

router.put("/removeFriendRequest", userController.removeFriendRequest);

router.put("/acceptFriendRequest", userController.acceptFriendRequest);

router.put("/declineFriendRequest", userController.declineFriendRequest);

router.put("/removeFriend", userController.removeFriend);

router.put("/updateProfile", userController.updateProfile)

router.delete("/deleteAccount", userController.deleteAccount);

export default router;
