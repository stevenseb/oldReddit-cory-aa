const express = require('express');
const Post = require('../../../models/Post');
const PostSub = require('../../../models/PostSub');
const SubReddit = require('../../../models/SubReddit');
const passport = require('passport');
const validatePostInput = require('../../../validation/post');
const redisClient = require('../../../config/redisClient')
const { parseFilters, generateNextPageToken, easyParse, buildPostsQuery } = require('../../../utils/pagination');

const router = express.Router();

module.exports = router;

router.get('/', async (req, res) => {
	try {
		const { subRedditId, view, limit, pageToken } = parseFilters(req.query, 'posts');
		// Ensure subRedditId is provided
		if (!subRedditId) {
			return res.status(400).json({ error: "subRedditId is required" });
		}

		const cacheKey = `posts:${subRedditId}:${view}:${limit}:${JSON.stringify(pageToken)}`;
		const cachedPosts = await redisClient.get(cacheKey);

		if (cachedPosts) {
			console.log('Cache hit for posts')
			let { posts, nextPageToken } = easyParse(cachedPosts);

			return res.json({ posts, nextPageToken })
		}

		// Cache miss: Fetch posts from MongoDB

		const postSubs = await PostSub.find({ subId: subRedditId }).select('postId');

		// If no postSubs are found, return an empty array
		if (!postSubs.length) {
			console.log("No posts found")
			return res.json([]);
		}

		const postIds = postSubs.map(postSub => postSub.postId);

		let postsQuery = buildPostsQuery(postIds, view, pageToken);

		postsQuery = postsQuery.limit(Number(limit));

		const posts = await postsQuery.exec();

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
