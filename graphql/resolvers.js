const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
  createUser: async function ({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'E-Mail is invalid' });
    }
    if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 3 })) {
      errors.push({ message: 'Password to short' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.statusCode = 422;
      error.data = errors;
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      throw new Error('User exists already!');
    }

    const hashedPassword = await bcrypt.hash(userInput.password, 10);
    const newUser = await new User({ email: userInput.email, name: userInput.name, password: hashedPassword }).save();
    return { ...newUser._doc, _id: newUser._id.toString() };
  },

  login: async function ({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User not found!');
      error.statusCode = 401;
      throw error;
    }
    const doMatch = await bcrypt.compare(password, user.password);
    if (!doMatch) {
      const error = new Error('Incorrect password!');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_KEY,
      { expiresIn: '1h' },
    );
    return { token, userId: user._id.toString() };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated!');
      error.statusCode = 401;
      throw error;
    }

    const errors = [];
    if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
      errors.push({ message: 'Title is invalid' });
    }
    if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
      errors.push({ message: 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.statusCode = 422;
      error.data = errors;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid User!');
      error.statusCode = 401;
      throw error;
    }

    const newPost = await new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    }).save();

    user.posts.push(newPost);

    return {
      ...newPost._doc,
      _id: newPost._id.toString(),
      createdAt: newPost.createdAt.toISOString(),
      updatedAt: newPost.updatedAt.toISOString(),
    };
  },
};
