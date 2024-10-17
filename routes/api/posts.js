const express = require('express');
const Post = require('../../models/Post');
const PostSub = require('../../models/PostSub');
const SubReddit = require('../../models/SubReddit');
const Comment = require('../../models/Comment');
const passport = require('passport');
const validatePostInput = require('../../validation/post');

const router = express.Router();

module.exports = router;

router.get('/', async (req, res) => {
	try {
		const { view = "Hot", subRedditId } = JSON.parse(req.query?.filters);
		const { limit = 10, pageToken = null } = req.query;
		
		// Ensure subRedditId is provided
		if (!subRedditId) {
			return res.status(400).json({ error: "subRedditId is required" });
		}

		// Step 1: Get postIds from PostSub based on subRedditId
		const postSubs = await PostSub.find({ subId: subRedditId }).select('postId');

		// If no postSubs are found, return an empty array
		if (!postSubs.length) {
			console.log("No posts found")
			return res.json([]);
		}
		// Extract postIds from the PostSub documents
		const postIds = postSubs.map(postSub => postSub.postId);

		// Step 2: Query the Post collection using the postIds
		let postsQuery = Post.find({ _id: { $in: postIds } });

		// Step 3: Apply sorting based on the view filter
		if (view === 'New') {
			// Sort by creation date (newest first) and paginate with createdAt
            postsQuery = postsQuery.sort({ createdAt: -1 });
            // Pagination based on createdAt timestamp
            if (pageToken) {
				const {createdAt} = JSON.parse(pageToken)
                postsQuery = postsQuery.where('createdAt').lt(new Date(createdAt));
            }
		} else if (view === 'Top') {
			 // Sort by netUpvotes with createdAt as a secondary sort (for tie-breaking)
            postsQuery = postsQuery.sort({ netUpvotes: -1, createdAt: -1 });

            // Pagination based on netUpvotes with createdAt fallback
            if (pageToken) {	
                const { netUpvotes, createdAt } = JSON.parse(pageToken);
				console.log(netUpvotes, createdAt)
                postsQuery = postsQuery.or([
                    { netUpvotes: { $lt: netUpvotes } },
                    { netUpvotes: netUpvotes, createdAt: { $lt: new Date(createdAt) } }
                ]);
            }
		} else {
			// Default to Hot
			// Sort by precomputed rankingScore with createdAt as a secondary sort
            postsQuery = postsQuery.sort({ rankingScore: -1, createdAt: -1 });

            // Pagination based on rankingScore with createdAt fallback
            if (pageToken) {
                const { rankingScore, createdAt } = JSON.parse(pageToken);
                postsQuery = postsQuery.or([
                    { rankingScore: { $lt: rankingScore } },
                    { rankingScore: rankingScore, createdAt: { $lt: new Date(createdAt) } }
                ]);
            }
		}
		// Step 4: Apply the limit to the query
        postsQuery = postsQuery.limit(Number(limit));

		// Step 5: Execute the query and return the posts
		const posts = await postsQuery.exec();

		// Step 6: Generate the next pageToken (if more posts are available)
		let nextPageToken = null;
		if (posts.length === Number(limit)) {
			const lastPost = posts[posts.length - 1];
            if (view === 'New') {
                nextPageToken = JSON.stringify({createdAt: lastPost.createdAt.toISOString()});  // Timestamp for 'New'
            } else if (view === 'Top') {
                nextPageToken = JSON.stringify({
                    netUpvotes: lastPost.netUpvotes,
                    createdAt: lastPost.createdAt.toISOString()
                });  // Upvotes and timestamp for 'Top'
            } else if (view === 'Hot') {
                nextPageToken = JSON.stringify({
                    rankingScore: lastPost.rankingScore,
                    createdAt: lastPost.createdAt.toISOString()
                });  // RankingScore and timestamp for 'Hot'
            }
		}

		return res.json({
			posts,
			nextPageToken
		});
	} catch (errors) {
		console.log(errors)
		res.status(400).json(errors);
	}
});

const _formatComments = (commentList) => {
	const commentMap = {};

	// move all the comments into a map of id => comment
	commentList.forEach((comment) => (commentMap[comment._id] = comment));

	// iterate over the comments again and correctly nest the children
	commentList.forEach((comment) => {
		if (comment.parentCommentId != null) {
			const parent = commentMap[comment.parentCommentId];
			(parent.children = parent.children || []).push(comment);
		}
	});
	debugger;
	// filter the list to return a list of correctly nested comments
	return commentList.filter((comment) => {
		return comment.parentCommentId == null;
	});
};

router.get('/:id', async (req, res) => {
	try {
		//TODO: Add validations to endpoint
		let post = await Post.findById(req.params.id)//.lean().populate('comments'); //.populate([
		// 	{
		// 		path: 'comments',
		// 		model: 'comments',
		// 		populate: {
		// 			path: 'childComments',
		// 			model: 'comments',
		// 		},
		// 	},
		// ]);

		// post.formattedComments = _formatComments(post.comments);
		res.json(post);
	} catch (errors) {
		console.log(errors);
		res.status(404).json({ noPostFound: "That post doesn't exist" });
	}
});

router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// TODO: REWORK CONTROLLER TO ALLOW USERS TO POST TO THEIR OWN PROFILES AS WELL AS SUBS
		const { errors, isValid } = validatePostInput(req.body);
		if (!isValid) {
			return res.status(400).json(errors);
		}
		try {
			let sub = await SubReddit.findById(req.body.subId);

			const newPost = new Post({
				userId: req.user.id,
				title: req.body.title,
				url: req.body.url,
				body: req.body.body,
			});
			const postSub = new PostSub({
				postId: newPost._id,
				subId: sub._id
			})
			
			await Promise.all([newPost.save(), postSub.save()]);
			res.json(newPost);
		} catch (errors) {
			res.status(400).json(errors);
		}
	}
);
