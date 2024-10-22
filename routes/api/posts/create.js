const mongoose = require('mongoose');
const authenticate = require('../../../utils/authenticate');
const keys = require('../../../config/keys')
const redisClient = require('../../../config/redisClient')
const validatePostInput = require('../../../validation/post')
mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const PostSub = require('../../../models/PostSub');
const Post = require('../../../models/Post');

(async () => {
    await redisClient.connect().catch(console.error);
})();

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

        const { errors, isValid } = validatePostInput(event.body);
        if (!isValid) {
            return {
                statusCode: 400,
                body: JSON.stringify(errors)
            }
        }

        const newPost = new Post({
            userId: user._id,
            title: event.body.title,
            url: event.body.url,
            body: event.body.body,
        });
        const postSub = new PostSub({
            postId: newPost._id,
            subId: event.body.subId
        })

        const cacheKey = `posts:${event.body.subId}:*`; // Invalidate all related comment caches
        const keys = await redisClient.keys(cacheKey);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            await redisClient.del(key);
        }

        await Promise.all([newPost.save(), postSub.save()]);
        
        return {
            statusCode: 200,
            body: JSON.stringify(newPost)
        }
    } catch (error) {
        console.log(error)
        return{
            statusCode: 500,
            body: JSON.stringify({ error: 'Something went wrong', details: error }),
        }
    }
}
