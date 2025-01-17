const mongoose = require('mongoose');
const authenticate = require('../../../utils/authenticate');
const keys = require('../../../config/keys')
mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event) => {
  const token = event.headers.Authorization?.split(' ')[1];

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'No token provided' }),
    };
  }

  try {
    const user = await authenticate(token);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
      }),
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid token' }),
    };
  }
};