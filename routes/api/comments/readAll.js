const mongoose = require('mongoose');
const keys = require('../../../config/keys')
const redisClient = require('../../../config/redisClient')
const { 
    parseFilters, 
    buildCommentQueryAndSort, 
    generateNextPageToken, 
    easyParse, 
    fetchRepliesRecursive 
} = require('../../../utils/pagination');
mongoose.connect(keys.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const Comment = require('../../../models/Comment');

(async () => {
    await redisClient.connect().catch(console.error);
})();

exports.handler = async (event) => {
	try {
        const queryParams = event.queryStringParameters || {};
		const { postId, view, limit, pageToken } = parseFilters(queryParams, 'comments');
        
        if (!postId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'postId is required' }),
            };
        }

		const cacheKey = `comments:${postId}:${view}:${limit}:${JSON.stringify(pageToken)}`; // Create a unique cache key

		// Check Redis cache first
		const cachedComments = await redisClient.get(cacheKey);

		if (cachedComments) {
			console.log('Cache hit for comments');
			let { comments, nextPageToken } = easyParse(cachedComments);
			if (nextPageToken === null) {
				nextPageToken = generateNextPageToken(comments, limit, view);
			}
            return {
                statusCode: 200,
                body: JSON.stringify({ comments, nextPageToken })
            }
		}

		// Cache miss: Fetch from MongoDB
		const { query, sortOption } = buildCommentQueryAndSort(postId, view, pageToken);
		const topLevelComments = await Comment.find(query).sort(sortOption).limit(parseInt(limit)).lean();

		// Limit replies per top-level comment
		const replyLimit = 5;

		// Fetch replies for each top-level comment with pagination
		for (const comment of topLevelComments) {
			const { replies, nextPageToken: replyPageToken } = await fetchRepliesRecursive(comment._id, replyLimit, null);
			comment.replies = replies;
			comment.replyNextPageToken = replyPageToken; // Attach pagination token for replies
		}

		const nextPageToken = generateNextPageToken(topLevelComments, limit, view);

		// Cache the results with an expiration time
		redisClient.set(cacheKey, JSON.stringify({ comments: topLevelComments, nextPageToken }), 'EX', 60 * 5); // Cache for 5 minutes

        return {
                statusCode: 200,
                body: JSON.stringify({ comments: topLevelComments, nextPageToken })
            }

	} catch (error) {
		console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Something went wrong'})
        }
	}
};