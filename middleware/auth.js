const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  try {
    // const token = req.headers.authorization.split(' ')[1]; // or
    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    if (!decodedToken || !token) {
      const error = new Error('Auth failed');
      error.statusCode = 401;
      throw error;
    }
    req.userId = decodedToken.userId;
    next();
  } catch (err) {
    req.isAuth = false;
    return next();
  }
};
