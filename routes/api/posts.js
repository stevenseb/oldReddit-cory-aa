const express = require('express');
const Post = require('../../models/Post');
const PostSub = require('../../models/PostSub');
const SubReddit = require('../../models/SubReddit');
const Comment = require('../../models/Comment');
const passport = require('passport');
const validatePostInput = require('../../validation/post');
const redisClient = require('../../config/redisClient')
const { parseFilters, generateNextPageToken, easyParse } = require('../../utils/pagination');

const router = express.Router();

module.exports = router;

router.get('/', async (req, res) => {
	try {
		const { subRedditId, view, limit, pageToken } = parseFilters(req.query, 'posts');
		// Ensure subRedditId is provided
		if (!subRedditId) {
			return res.status(400).json({ error: "subRedditId is required" });
		}

		// Step 0: Check the cache
		const cacheKey = `posts:${subRedditId}:${view}:${limit}:${JSON.stringify(pageToken)}`;
		const cachedPosts = await redisClient.get(cacheKey);

		if (cachedPosts) {
			console.log('Cache hit for posts')
			let { posts, nextPageToken } = easyParse(cachedPosts);
			
			return res.json({posts, nextPageToken})
		}

		// Cache miss: Fetch posts from MongoDB

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
				const { createdAt } = easyParse(pageToken);
                postsQuery = postsQuery.where('createdAt').lt(new Date(createdAt));
            }
		} else if (view === 'Top') {
			 // Sort by netUpvotes with createdAt as a secondary sort (for tie-breaking)
            postsQuery = postsQuery.sort({ netUpvotes: -1, createdAt: -1 });

            // Pagination based on netUpvotes with createdAt fallback
            if (pageToken) {	
                const { netUpvotes, createdAt } = easyParse(pageToken);

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
                const { rankingScore, createdAt } = easyParse(pageToken);
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
		let nextPageToken = generateNextPageToken(posts, limit, view);

		redisClient.set(cacheKey, JSON.stringify({ posts, nextPageToken: nextPageToken }), 'EX', 60 * 5); // Cache for 5 minutes

		return res.json({
			posts,
			nextPageToken
		});
	} catch (errors) {
		console.log(errors)
		res.status(400).json(errors);
	}
});

router.get('/:id', async (req, res) => {
	try {
		//TODO: Add validations to endpoint
		let post = await Post.findById(req.params.id)
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

			const cacheKey = `posts:${req.body.subRedditId}:*`; // Invalidate all related comment caches
			const keys = await redisClient.keys(cacheKey);
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				await redisClient.del(key);
			}
			
			await Promise.all([newPost.save(), postSub.save()]);
			res.json(newPost);
		} catch (errors) {
			res.status(400).json(errors);
		}
	}
);
