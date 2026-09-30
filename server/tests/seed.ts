import { faker } from "@faker-js/faker";
import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";

type UserDoc = InstanceType<typeof User>;
type PostDoc = InstanceType<typeof Post>;
type CommentDoc = InstanceType<typeof Comment>;

const users: UserDoc[] = [];
const posts: PostDoc[] = [];
const comments: CommentDoc[] = [];

const generateUser = () => {
  const user = new User({
    email: faker.internet.email(),
    password: faker.image.url(),
    firstname: faker.person.firstName().slice(0, 15),
    lastname: faker.person.lastName().slice(0, 15),
    profilePicUrl: faker.image.url(),
  });
  users.push(user);
};

const generatePost = (user: UserDoc) => {
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

const generateComment = (user: UserDoc) => {
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

const addCommentsToPosts = () => {
  users.forEach((user) => {
    for (let i = 0; i < 5; i++) {
      generateComment(user);
    }
  });
};

export const seed = async () => {
  for (let i = 0; i < 6; i++) {
    generateUser();
  }
  addPostsToUser();
  addCommentsToPosts();

  await User.insertMany(users);
  await Post.insertMany(posts);
  await Comment.insertMany(comments);

  return { users, posts, comments };
};
