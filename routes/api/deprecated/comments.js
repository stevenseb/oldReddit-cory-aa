const express = require('express');
const Comment = require('../../../models/Comment');
const passport = require('passport');
const validateCommentInput = require('../../../validation/comment');
const redisClient = require('../../../config/redisClient')
const { parseFilters, buildCommentQueryAndSort, generateNextPageToken, easyParse, fetchRepliesRecursive } = require('../../../utils/pagination');

const router = express.Router();

module.exports = router;

router.get('/', async (req, res) => {
	try {

		const { postId, view, limit, pageToken } = parseFilters(req.query, 'comments');
		const cacheKey = `comments:${postId}:${view}:${limit}:${JSON.stringify(pageToken)}`; // Create a unique cache key

		// Check Redis cache first
		const cachedComments = await redisClient.get(cacheKey);

		if (cachedComments) {
			console.log('Cache hit for comments');
			let { comments, nextPageToken } = easyParse(cachedComments);
			if (nextPageToken === null) {
				nextPageToken = generateNextPageToken(comments, limit, view);
			}
			return res.json({ comments, nextPageToken });
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

		res.json({ comments: topLevelComments, nextPageToken });

	} catch (err) {
		console.error(err);
		res.status(404).json({ noCommentsFound: 'No comments yet' });
	}
});

router.get('/:commentId/replies', async (req, res) => {
	try {
		const { limit = 5, pageToken = null } = easyParse(req.query);
		const { commentId } = easyParse(req.params);
		const cacheKey = `replies:${commentId}:${limit}:${JSON.stringify(pageToken)}`; // Create a unique cache key for replies

		// Check Redis cache first
		const cachedReplies = await redisClient.get(cacheKey);

		if (cachedReplies) {
			console.log('Cache hit for replies');
			let { replies, nextPageToken } = easyParse(cachedReplies);

			return res.json({ replies, replyNextPageToken: nextPageToken }); // Return cached replies
		}

		// Cache miss: Fetch replies for the specified comment with pagination
		const { replies, nextPageToken } = await fetchRepliesRecursive(commentId, limit, pageToken, 'Replies');
		// Cache the replies with an expiration time
		redisClient.set(cacheKey, JSON.stringify({ replies, nextPageToken: nextPageToken }), 'EX', 60 * 5); // Cache for 5 minutes

		res.json({ replies, replyNextPageToken: nextPageToken });

	} catch (err) {
		console.error(err);
		res.status(404).json({ noRepliesFound: 'No replies yet' });
	}
});

router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		const { errors, isValid } = validateCommentInput(req.body);
		if (!isValid) {
			return res.status(400).json(errors);
		}
		console.log("Comment is valid")
		try {
			const comment = new Comment({
				userId: req.user.id,
				postId: req.body.postId,
				body: req.body.body,
			});

			if (req.body.parentCommentId) {
				comment.parentCommentId = req.body.parentCommentId;
			}
			comment.save()

			const cacheKey = `comments:${req.body.postId}:*`; // Invalidate all related comment caches
			const keys = await redisClient.keys(cacheKey);
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				await redisClient.del(key);
			}

			res.json(comment);
		} catch (errors) {
			console.log(errors);
			res.status(400).json(errors);
		}
	}
);

router.delete(
	'/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		try {
			let comment = await Comment.findById(req.params.id);
			if (!comment)
				return res
					.status(404)
					.json({ noCommentFound: "That comment doesn't exist" });
			if (req.user.id == comment.userId) {
				await comment.deleteOne();
				return res.json(comment);
			}
			res.status(403).json({
				notAuthorized: 'You did not make this comment',
			});
		} catch (errors) {
			res.status(400).json(errors);
		}
	}
);
