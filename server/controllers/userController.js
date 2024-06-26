const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const { generateUploadURL, deleteFile } = require("../config/s3");
const { body, validationResult } = require("express-validator");

exports.getUser = async (req, res, next) => {
  try {
    const users = await User.find({});
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.profileId);
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { userId, profileId } = req.body;
    const user = await User.findById(profileId);
    // the sender and receiver are the same user
    if (profileId === userId) {
      return res
        .status(400)
        .json({ message: "User can send request only to other user" });
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
    return res.status(500).json({ message: err.message });
  }
};

exports.removeFriendRequest = async (req, res, next) => {
  try {
    const { userId, profileId } = req.body;
    const user = await User.findByIdAndUpdate(profileId);
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
    return res.status(500).json({ message: err.message });
  }
};

exports.friendRequestsByUserId = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    const friendRequestsData = [];

    if (user.friendRequests.length < 1) {
      return res.status(200).json([]);
    }

    //create an array with photo, id and name of the user
    //that sent the friend request
    for (let i = 0; i < user.friendRequests.length; i++) {
      const userProfile = await User.findById(user.friendRequests[i]);

      const userData = {
        id: userProfile._id,
        profilePicUrl: userProfile.profilePicUrl,
        fullname: userProfile.fullname,
      };
      friendRequestsData.push(userData);
    }

    return res.status(200).json(friendRequestsData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//show only 3 requests
exports.friendRequestsByUserId3 = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    const friendRequestsData = [];

    if (user.friendRequests.length < 1) {
      return res.status(200).json([]);
    }

    // se the number of loop to a maximum of 3 if
    // finds least is greater then 3
    let numberLoop;
    if (user.friends.length < 3) {
      numberLoop = user.friendRequests.length;
    } else {
      numberLoop = 3;
    }

    for (let i = 0; i < numberLoop; i++) {
      const userProfile = await User.findById(user.friendRequests[i]);

      if (!userProfile) return;

      const userData = {
        id: userProfile._id,
        profilePicUrl: userProfile.profilePicUrl,
        fullname: userProfile.fullname,
      };
      friendRequestsData.push(userData);
    }

    return res.status(200).json(friendRequestsData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.suggestedProfile = async (req, res, next) => {
  try {
    //get user friend list
    const user = await User.findById(req.params.userId);

    // add user id to the list so it doenst appear in the usggested profile
    user.friends.push(req.params.userId);
    const profiles = await User.find({ _id: { $nin: user.friends } });
    if (profiles.length < 1) {
      return res.status(200).json([]);
    }
    return res.status(200).json(profiles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//return only 3 suggested profile
exports.suggestedProfile3 = async (req, res, next) => {
  try {
    //get user friend list
    const user = await User.findById(req.params.userId);

    // add user id to the list so it doenst appear in the usggested profile
    user.friends.push(req.params.userId);
    const profiles = await User.find({ _id: { $nin: user.friends } }).limit(3);

    if (profiles.length < 1) {
      return res.status(200).json([]);
    }
    return res.status(200).json(profiles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getFriendsByUserId = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No users found" });
    }

    if (user.friends.length < 1) {
      return res.status(200).json([]);
    }

    const friendsData = [];
    // for every friend id create an object with id, photo and name
    // to show in the friend list

    for (let i = 0; i < user.friends.length; i++) {
      const userProfile = await User.findById(user.friends[i]);

      const userData = {
        id: userProfile._id,
        profilePicUrl: userProfile.profilePicUrl,
        fullname: userProfile.fullname,
      };

      friendsData.push(userData);
    }

    return res.status(200).json(friendsData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//show only 3
exports.getFriendsByUserId3 = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No users found" });
    }

    if (user.friends.length < 1) {
      return res.status(200).json([]);
    }

    const friendsData = [];
    // se the number of loop to a maximum of 3 if
    // firnds least is greater then 3
    let numberLoop;
    if (user.friends.length < 3) {
      numberLoop = user.friends.length;
    } else {
      numberLoop = 3;
    }

    // for every friend id create an object with id, photo and name
    // to show in the friend list
    for (let i = 0; i < numberLoop; i++) {
      const userProfile = await User.findById(user.friends[i]);

      const userData = {
        id: userProfile._id,
        profilePicUrl: userProfile.profilePicUrl,
        fullname: userProfile.fullname,
      };
      friendsData.push(userData);
    }

    return res.status(200).json(friendsData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { userId, profileId } = req.body;
    //
    const user = await User.findById(userId);
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
    profile.friends.push(userId);
    await profile.save();

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
    return res.status(500).json({ message: err.message });
  }
};

exports.declineFriendRequest = async (req, res, next) => {
  try {
    const { userId, profileId } = req.body;

    const user = await User.findById(userId);
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
    return res.status(500).json({ message: err.message });
  }
};

exports.removeFriend = async (req, res, next) => {
  try {
    const { userId, profileId } = req.body;

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
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.body;
    //delete user
    const deleteUser = await User.findByIdAndDelete(id);

    deleteFile(deleteUser.profilePicUrl);
    deleteFile(deleteUser.coverPicUrl);

    if (!deleteUser) {
      return res.status(404).json({ message: "No users found" });
    }

    // find the post to delte
    const postPicToDelete = await Post.find({ authorId: id });

    for (let i = 0; i < postPicToDelete.length; i++) {
      //check if in any on of them ther is a picture
      if (postPicToDelete[i].picUrl !== "") {
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
    return res.status(500).json({ message: err.message });
  }
};

exports.generateUrlS3 = async (req, res) => {
  try {
    const url = await generateUploadURL();
    res.status(200).send(url);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.changePic = async (req, res) => {
  try {
    const { id, imageUrl, profileOrCover } = req.body;
    const user = await User.findById(id);
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
    return res.status(500).json({ message: err.message });
  }
};

exports.getProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    return res.status(200).json(user.profilePicUrl);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = [
  body("firstname", "First name required").trim(),
  body("lastname", "Last name required").trim(),
  body("hometown").trim(),
  body("worksAt").trim(),
  body("relationship").trim(),
  async (req, res) => {
    const {
      id,
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
      return res.json({ errors: errors.array() });
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
      await user.save();
      return res.status(200).json({ message: "Profile updated" });
    } catch (err) {
      console.log(err.message);
      return res.status(500).json({ message: err.message });
    }
  },
];

exports.getNofication = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    if (user.notifications.length < 1) {
      return res.status(200).json({ notifications: [], unchecked: [] });
    }
    // get profile picture and name of the user and add it to the notification message
    for (let i = 0; i < user.notifications.length; i++) {
      const userInfo = await User.findById(user.notifications[i].userId);
      user.notifications[i].profilePicUrl = userInfo.profilePicUrl;
      user.notifications[i].fullname = userInfo.fullname;
    }

    const unchecked = user.notifications.filter(
      (notification) => notification.seen === false
    );
    // order notification from the most recent
    const notifications = user.notifications.sort((a, b) => -a.date);
    return res.status(200).json({ notifications, unchecked });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.checkNotification = async (req, res, next) => {
  try {
    // Ensure the request body contains an id
    if (!req.body.id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Update all notifications to mark them as seen
    const checkNotification = await User.findByIdAndUpdate(
      req.body.id,
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
    return res.status(500).json({ message: err.message });
  }
};
