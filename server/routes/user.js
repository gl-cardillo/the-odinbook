const userController = require("../controllers/userController");
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

router.get("/", userController.getUser);

router.get("/profile/:profileId", userController.getUserById);

router.get("/get3SuggestedProfile/:userId", userController.suggestedProfile3);

router.get("/getSuggestedProfile/:userId", userController.suggestedProfile);

router.get("/friendRequests/:userId", verifyToken, userController.friendRequestsByUserId);

router.get("/friendRequests3/:userId", verifyToken, userController.friendRequestsByUserId3);

router.get("/friends/:userId", verifyToken, userController.getFriendsByUserId);

router.get("/friends3/:userId", verifyToken, userController.getFriendsByUserId3);

router.get("/profilePic/:userId", verifyToken, userController.getProfilePic);

router.get("/generateUrlS3", verifyToken, userController.generateUrlS3);

router.get("/getNotification/:userId", verifyToken, userController.getNofication);

router.put("/checkNotification", verifyToken, userController.checkNotification);

router.put("/changePic", verifyToken, userController.changePic);

router.put("/sendFriendRequest", verifyToken, userController.sendFriendRequest);

router.put("/removeFriendRequest", verifyToken, userController.removeFriendRequest);

router.put("/acceptFriendRequest", verifyToken, userController.acceptFriendRequest);

router.put("/declineFriendRequest", verifyToken, userController.declineFriendRequest);

router.put("/removeFriend", verifyToken, userController.removeFriend);

router.put("/updateProfile", verifyToken, userController.updateProfile)

router.delete("/deleteAccount", verifyToken, userController.deleteAccount);

module.exports = router;
