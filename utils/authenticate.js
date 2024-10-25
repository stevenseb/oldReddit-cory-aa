const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/User');
const keys = require('../config/keys');

const authenticate = async (token) => {
	if (!token) return false;
	try {
		const decoded = jsonwebtoken.verify(token, keys.secretOrKey);
		const user = await User.findById(decoded.id);

		if (!user) return false;
		return user;
	} catch (error) {
		console.log(error);
		return false;
	}
};

module.exports = authenticate;
