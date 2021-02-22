const express = require('express');
const { body } = require('express-validator');

const feedController = require('../controllers/feed');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/posts', checkAuth, feedController.getPosts);

router.post(
  '/post',
  checkAuth,
  [
    body('title', 'Please enter a valid "title" field').trim().isString().isLength({ min: 5 }),
    body('content', 'Please enter a valid "content" field').trim().isString().isLength({ min: 5 }),
  ],
  feedController.createPost,
);

router.get('/post/:postId', feedController.getPost);

router.put(
  '/post/:postId',
  checkAuth,
  [
    body('title', 'Please enter a valid "title" field').trim().isString().isLength({ min: 5 }),
    body('content', 'Please enter a valid "content" field').trim().isString().isLength({ min: 5 }),
  ],
  feedController.updatePost,
);

router.delete('/post/:postId', checkAuth, feedController.deletePost);

module.exports = router;
