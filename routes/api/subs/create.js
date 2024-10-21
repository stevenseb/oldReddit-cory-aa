const mongoose = require('mongoose');
const keys = require('../../../config/keys');
const authenticate = require('../../../utils/authenticate');
const validateSubRedditInput = require('../../../validation/subReddit')
const { easyParse } = require('../../../utils/pagination')
mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const SubReddit = require('../../../models/SubReddit');

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
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid token' }),
            };
        }

        const { errors, isValid } = validateSubRedditInput(easyParse(event.body));
        console.log(event.body)
        if (!isValid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: errors })
            }
        }

        const newSubReddit = new SubReddit({
            moderatorId: user._id,
            title: event.body.title,
            desc: event.body.desc,
        });

        await newSubReddit.save();

        return {
            statusCode: 200,
            body: JSON.stringify({
                newSubReddit
            })
        }

    } catch (error) {
        console.log(error)
        return {
            statusCode: 400,
            body: JSON.stringify({ message: error })
        }
    }
}