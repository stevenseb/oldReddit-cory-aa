const express = require('express');
const Comment = require('../../models/Comment');
const passport = require('passport');
const validateCommentInput = require('../../validation/comment');

const router = express.Router();

module.exports = router;

router.get('/', async (req, res) => {
	try {
		// Parse the filters from the query
		const { postId, view = 'Hot' } = JSON.parse(req.query?.filters);
		const { limit = 10, pageToken = null } = req.query;

		// Initialize query and sorting
		let query = { postId };
		let sortOption = {};

		if (view === 'Hot') {
			sortOption = { rankingScore: -1, createdAt: -1 };
			if (pageToken) {
				const { createdAt } = JSON.parse(pageToken);
				query.createdAt = { $lt: new Date(createdAt) }; // Get posts older than pageToken
			}
		} else if (view === 'New') {
			sortOption = { createdAt: -1 };
			if (pageToken) {
				const { createdAt } = JSON.parse(pageToken);
				query.createdAt = { $lt: new Date(createdAt) }; // Get posts older than pageToken
			}
		} else if (view === 'Top') {
			sortOption = { netUpvotes: -1, createdAt: -1 };
      if (pageToken) {
				const { netUpvotes, createdAt } = JSON.parse(pageToken);
				query.$or = [
				{ netUpvotes: { $lt: netUpvotes } }, // Get posts with fewer upvotes
				{ netUpvotes, createdAt: { $lt: new Date(createdAt) } } // If equal upvotes, fetch older ones
				];
			}
		}
		// Find comments based on the query with sorting and pagination
		const comments = await Comment.find(query)
		.sort(sortOption)
		.limit(parseInt(limit));

		// Prepare the nextPageToken for pagination
		let nextPageToken = null;
		if (comments.length === limit) {
			const lastComment = comments[comments.length - 1];
			nextPageToken = JSON.stringify({
				createdAt: lastComment.createdAt,
				...(view === 'Top' && { netUpvotes: lastComment.netUpvotes }), // Include netUpvotes for Top view
			});
		}

		// Return comments with nextPageToken for pagination
		res.json({
			comments,
			nextPageToken,
		});	
	} catch (err) {
		console.log(err)
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
