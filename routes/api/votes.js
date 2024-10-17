const express = require('express');
const passport = require('passport');
const Post = require('../../models/Post');
const Vote = require('../../models/Vote');
// const validateVoteInput = require('../../validation/vote');

const router = express.Router();

module.exports = router;

router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// const { errors, isValid } = validateVoteInput(req.body);

		// if (!isValid) {
		// 	return res.status(400).json(errors);
		// }
		try {
			if (req.body.postId) {
				let post = await handleVoteOnPost(req);
				res.json(post);
			} else {
				let comment = await handleVoteOnComment(req);
				res.json(comment);
			}
		} catch (errors) {
			console.log(errors)
			res.status(400).json(errors);
		}
	}
);

const handleVoteOnPost = async (req) => {
	const [post, vote] = await Promise.all([
		Post.findById(req.body.postId),
		Vote.findOne({ postId: req.body.postId, userId: req.user.id }),
	]);
	return handleVote(req, post, vote);
};

const handleVoteOnComment = async (req) => {
	const [comment, vote] = await Promise.all([
		Comment.findById(req.body.commentId),
		Vote.findOne({ commentId: req.body.commentId, userId: req.user.id }),
	]);
	return handleVote(req, comment, vote);
};

const handleVote = async (req, document, vote) => {
	let voteToSave;
	
	// Check if the user has already voted
	if (vote?.userId?.toString() == req?.user?._id.toString()) {
		// If the user is trying to vote the same value again, we don't allow double voting
		if (vote.value === req.body.value) {
			// Reset the vote and subtract the original vote value from netUpvotes
			document.netUpvotes -= vote.value;
			vote.value = 0;
			voteToSave = vote;
		} else {
			// If the user changes the vote (e.g., from upvote to downvote)
			// Adjust netUpvotes accordingly
			document.netUpvotes += req.body.value - vote.value;
			vote.value = req.body.value;
			voteToSave = vote;
		}
	} else {
		// If the user hasn't voted yet, create a new vote
		voteToSave = new Vote({
			userId: req.user.id,
			value: req.body.value,
		});
		if (req.body.postId) {
			voteToSave.postId = req.body.postId;
			//precompute ranking score on votes
			document.calculateRankingScore();
		} else {
			voteToSave.commentId = req.body.commentId;
		}
		document.netUpvotes += req.body.value;
	}

	// Save the updated vote and the document
	await Promise.all([voteToSave.save(), document.save()]);

	return document;
};