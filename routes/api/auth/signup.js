const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const validateRegisterInput = require('../../../validation/signup');
const keys = require('../../../config/keys');

mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const User = require('../../../models/User');

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { errors, isValid } = validateRegisterInput(body);

  if (!isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify(errors),
    };
  }

  let user = await User.findOne({ email: body.email });
  if (user) {
    return {
      statusCode: 400,
      body: JSON.stringify({ email: 'A user has already registered with this address' }),
    };
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(body.password, salt);
    const payload = {
      username: body.username,
      email: body.email,
      passwordDigest: hash,
    };

    let userInstance = new User(payload);
    await userInstance.save();

    // Remove passwordDigest from payload
    payload.id = userInstance.id;
    delete payload.passwordDigest;

    // Sign JWT token
    const token = jsonwebtoken.sign(
      payload,
      keys.secretOrKey,
      { expiresIn: 3600 }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token: 'Bearer ' + token,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error }),
    };
  }
};