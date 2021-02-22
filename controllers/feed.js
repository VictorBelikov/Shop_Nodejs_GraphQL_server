const fs = require('fs');
const { validationResult } = require('express-validator');

const socket = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
};

exports.getPosts = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const itemsPerPage = 2;

    const numOfPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    res.status(200).json({
      message: 'Fetched posts successfully',
      posts,
      totalItems: numOfPosts,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const validationErrs = validationResult(req);
    if (!validationErrs.isEmpty()) {
      const error = new Error('Validation failed!');
      error.statusCode = 422;
      error.data = validationErrs.array();
      throw error;
    }

    const image = req.file;
    const { title } = req.body;
    const { content } = req.body;
    const { userId } = req; // check-auth.js:14

    if (!image) {
      const error = new Error('No image provided');
      error.statusCode = 422;
      throw error;
    }

    const post = await new Post({
      title,
      content,
      imageUrl: image.path,
      creator: userId,
    }).save();

    const user = await User.findById(userId);
    user.posts.push(post);
    await user.save();

    // emit() - send to all connected users; broadcast() - send to all connected users except the one from which was sent.
    socket
      .getIo()
      .emit('posts', { action: 'create', post: { ...post, creator: { _id: req.userId, name: user.name } } });

    res.status(201).json({
      message: 'Post created successfully!',
      post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return next(err);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      const error = new Error('Could not find post!');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: 'Post fetched', post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title } = req.body;
    const { content } = req.body;
    const validationErrs = validationResult(req);

    if (!validationErrs.isEmpty()) {
      const error = new Error('Validation failed!');
      error.statusCode = 422;
      error.data = validationErrs.array();
      throw error;
    }

    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Could not find post!');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not Authorized!');
      error.statusCode = 403;
      throw error;
    }

    if (req.file) {
      deleteFile(post.imageUrl);
      post.imageUrl = req.file.path;
    }
    post.title = title;
    post.content = content;
    const updatedPost = await post.save();

    // emit() - send to all connected users; broadcast() - send to all connected users except the one from which was sent.
    socket.getIo().emit('posts', { action: 'update', post: updatedPost });

    res.status(200).json({ message: 'Post updated', post: updatedPost });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post!');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not Authorized!');
      error.statusCode = 403;
      throw error;
    }
    deleteFile(post.imageUrl);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    await Post.deleteOne({ _id: postId });

    // emit() - send to all connected users; broadcast() - send to all connected users except the one from which was sent.
    socket.getIo().emit('posts', { action: 'delete', post: postId });

    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return next(err);
  }
};
