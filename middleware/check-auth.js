const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // const token = req.headers.authorization.split(' ')[1]; // or
    const token = req.get('Authorization')?.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    if (!decodedToken || !token) {
      const error = new Error('Auth failed');
      error.statusCode = 401;
      throw error;
    }
    req.userId = decodedToken.userId;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return next(err);
  }
};
