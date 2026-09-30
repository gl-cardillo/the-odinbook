const { faker } = require("@faker-js/faker");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

const users = [];
const posts = [];
const comments = [];

const generateUser = () => {
  const user = new User({
    email: faker.internet.email(),
    password: faker.image.url(),
    firstname: faker.person.firstName().slice(0, 15),
    lastname: faker.person.lastName().slice(0, 15),
    profilePicUrl: faker.image.url(),
    posts: [],
  });
  users.push(user);
};

const generatePost = (user) => {
  const post = new Post({
    authorId: user._id,
    text: faker.lorem.paragraphs(),
    date: faker.date.past(),
  });
  posts.push(post);
};

const addPostsToUser = () => {
  users.forEach((user) => {
    for (let i = 0; i < 5; i++) {
      generatePost(user);
    }
  });
};

const generateComment = (user) => {
  posts.forEach((post) => {
    const comment = new Comment({
      authorId: user.id,
      postId: post.id,
      text: faker.lorem.paragraphs(),
      date: faker.date.past(),
    });
    comments.push(comment);
  });
};

const addCommentsToPosts = (user) => {
  users.forEach((user) => {
    for (let i = 0; i < 5; i++) {
      generateComment(user);
    }
  });
};

exports.seed = async () => {
  try {
    for (let i = 0; i < 6; i++) {
      generateUser();
    }
    addPostsToUser();
    addCommentsToPosts();

    for ( user of users) {
      await user.save();
    }

    for (post of posts) {
      await post.save();
    }

    for (comment of comments) {
      await comment.save();
    }
  } catch (error) {
    console.log(error);
  }

  return { users, posts, comments };
};
