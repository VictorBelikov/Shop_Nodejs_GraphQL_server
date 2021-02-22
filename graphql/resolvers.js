const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user');

module.exports = {
  hello() {
    return 'Hello, world!';
  },

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
};
