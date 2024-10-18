const express = require('express');
const Comment = require('../../models/Comment');
const passport = require('passport');
const validateCommentInput = require('../../validation/comment');

const router = express.Router();

module.exports = router;

// Helper function to parse query filters
const parseFilters = (query) => {
	const { postId, view = 'Hot' } = JSON.parse(query?.filters || '{}');
	const { limit = 10, pageToken = null } = query;
	return { postId, view, limit, pageToken };
};

// Helper function to build the query and sort options based on the view
const buildQueryAndSort = (postId, view, pageToken) => {
	let query = { postId, parentCommentId: null }; // Fetch only top-level comments
	let sortOption = {};

	if (view === 'Hot' || view === 'New') {
		sortOption = { createdAt: -1 };
		if (view === 'Hot') {
			sortOption = { rankingScore: -1, ...sortOption };
		}
		if (pageToken) {
			const { createdAt } = JSON.parse(pageToken);
			query.createdAt = { $lt: new Date(createdAt) };
		}
	} else if (view === 'Top') {
		sortOption = { netUpvotes: -1, createdAt: -1 };
		if (pageToken) {
			const { netUpvotes, createdAt } = JSON.parse(pageToken);
			query.$or = [
				{ netUpvotes: { $lt: netUpvotes } },
				{ netUpvotes, createdAt: { $lt: new Date(createdAt) } }
			];
		}
	}

	return { query, sortOption };
};

// Helper function to generate the nextPageToken for pagination
const generateNextPageToken = (items, limit, view) => {
	if (items.length < limit) return null;

	const lastItem = items[items.length - 1];
	const tokenData = { createdAt: lastItem.createdAt };

	if (view === 'Top' && lastItem.netUpvotes) {
		tokenData.netUpvotes = lastItem.netUpvotes;
	}

	return JSON.stringify(tokenData);
};

// Helper function to fetch replies with pagination
const fetchReplies = async (parentCommentId, limit, pageToken) => {
	let query = { parentCommentId };
	let sortOption = { createdAt: 1 }; // Replies sorted by creation time

	// Handle pagination for replies
	if (pageToken) {
		const { createdAt } = JSON.parse(pageToken);
		query.createdAt = { $lt: new Date(createdAt) };
	}

	const replies = await Comment.find(query).sort(sortOption).limit(parseInt(limit));

	const nextPageToken = generateNextPageToken(replies, limit, 'Replies');

	return { replies, nextPageToken };
};

router.get('/', async (req, res) => {
	try {
		
		const { postId, view, limit, pageToken } = parseFilters(req.query);

		const { query, sortOption } = buildQueryAndSort(postId, view, pageToken);

		const topLevelComments = await Comment.find(query).sort(sortOption).limit(parseInt(limit)).lean();

		// Limit replies per top-level comment
		const replyLimit = 5;

		// Fetch replies for each top-level comment with pagination
		for (const comment of topLevelComments) {
			const { replies, nextPageToken: replyPageToken } = await fetchReplies(comment._id, replyLimit, null);
			comment.replies = replies; 
			comment.replyNextPageToken = replyPageToken; // Attach pagination token for replies
		}

		const nextPageToken = generateNextPageToken(topLevelComments, limit, view);

		res.json({ comments: topLevelComments, nextPageToken });

	} catch (err) {
		console.error(err);
		res.status(404).json({ noCommentsFound: 'No comments yet' });
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
