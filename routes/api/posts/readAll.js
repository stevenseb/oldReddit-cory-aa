const mongoose = require('mongoose');
const redisClient = require('../../../config/redisClient');
const { parseFilters, generateNextPageToken, easyParse, buildPostsQuery } = require('../../../utils/pagination');
const keys = require('../../../config/keys')
mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const PostSub = require('../../../models/PostSub');

(async () => {
    await redisClient.connect().catch(console.error);
})();

exports.handler = async (event) => {
    try {
        // Parse query parameters from Lambda event
        const queryParams = easyParse(event.queryStringParameters) || {};
        const { subRedditId, view, limit, pageToken } = parseFilters(queryParams, 'posts');
        
        //tomorrow refactor queryParams so you get the stuff correctly
        console.log("params: ",queryParams)
        console.log("token: ",pageToken)
        console.log("view: ",view)
        console.log("limit: ",limit)
        console.log("subId: ",subRedditId)

        if (!subRedditId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'subRedditId is required' }),
            };
        }

        const cacheKey = `posts:${subRedditId}:${view}:${limit}:${JSON.stringify(pageToken)}`;
        const cachedPosts = await redisClient.get(cacheKey);

        if (cachedPosts) {
            console.log('Cache hit for posts');
            let { posts, nextPageToken } = easyParse(cachedPosts);
            return {
                statusCode: 200,
                body: JSON.stringify({ posts, nextPageToken }),
            };
        }

        // Cache miss: Fetch posts from database (MongoDB, DynamoDB, etc.)
        const postSubs = await PostSub.find({ subId: subRedditId }).select('postId');

        // If no postSubs are found, return an empty array
        if (!postSubs.length) {
            console.log('No posts found');
            return {
                statusCode: 200,
                body: JSON.stringify([]),
            };
        }

        const postIds = postSubs.map((postSub) => postSub.postId);

        let postsQuery = buildPostsQuery(postIds, view, pageToken);
        postsQuery = postsQuery.limit(Number(limit));

        const posts = await postsQuery.exec(); // MongoDB or equivalent call in DynamoDB

        let nextPageToken = generateNextPageToken(posts, limit, view);

        // Cache result in Redis for 5 minutes
        await redisClient.set(
            cacheKey,
            JSON.stringify({ posts, nextPageToken }),
            'EX',
            60 * 5 // Cache expiration (5 minutes)
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ posts, nextPageToken }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Something went wrong', details: error }),
        };
    }
};