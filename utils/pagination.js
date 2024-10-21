// Pagination Helpers
const easyParse = (item) => {
	return typeof item === 'string' ? JSON.parse(item) : item;
}

// Helper function to parse query filters
const parseFilters = (query, entityName) => {
	if (entityName === 'comments') {
		const { postId, view = 'Hot' } = query?.filters || '{}';
		const { limit = 10, pageToken = null } = query;
		return { postId, view, limit, pageToken };
	} else { // posts
		const { subRedditId, view = 'Hot' } = query?.filters || '{}';
		const { limit = 10, pageToken = null } = query;
		return { subRedditId, view, limit, pageToken };
	}
};

const buildCommentQueryAndSort = (postId, view, pageToken) => {
	let query = { postId, parentCommentId: null }; // Fetch only top-level comments
	let sortOption = {};

	if (view === 'Hot') {
		sortOption = { rankingScore: -1, ...sortOption };
		if (pageToken) {
			const { rankingScore, createdAt } = pageToken;
			query.$or = [
				{ rankingScore: { $lt: rankingScore } },
				{ rankingScore, createdAt: { $lt: new Date(createdAt) } }
			];
		}
	} else if (view === "New") {
		sortOption = { createdAt: -1 };
		if (pageToken) {
			const { createdAt } = pageToken;
			query.createdAt = { $lt: new Date(createdAt) }
		}
	} else if (view === 'Top') {
		sortOption = { netUpvotes: -1, createdAt: -1 };
		if (pageToken) {
			const { netUpvotes, createdAt } = pageToken;
			query.$or = [
				{ netUpvotes: { $lt: netUpvotes } },
				{ netUpvotes, createdAt: { $lt: new Date(createdAt) } }
			];
		}
	}

	return { query, sortOption };
};

const buildPostsQuery = (postIds, view, pageToken) => {
	let postsQuery = Post.find({ _id: { $in: postIds } });

	// Apply sorting based on the view
	if (view === 'New') {
		postsQuery = postsQuery.sort({ createdAt: -1 });
		if (pageToken) {
			const { createdAt } = easyParse(pageToken);
			postsQuery = postsQuery.where('createdAt').lt(new Date(createdAt));
		}
	} else if (view === 'Top') {
		postsQuery = postsQuery.sort({ netUpvotes: -1, createdAt: -1 });
		if (pageToken) {
			const { netUpvotes, createdAt } = easyParse(pageToken);
			postsQuery = postsQuery.or([
				{ netUpvotes: { $lt: netUpvotes } },
				{ netUpvotes, createdAt: { $lt: new Date(createdAt) } }
			]);
		}
	} else {
		postsQuery = postsQuery.sort({ rankingScore: -1, createdAt: -1 });
		if (pageToken) {
			const { rankingScore, createdAt } = easyParse(pageToken);
			postsQuery = postsQuery.or([
				{ rankingScore: { $lt: rankingScore } },
				{ rankingScore, createdAt: { $lt: new Date(createdAt) } }
			]);
		}
	}

	return postsQuery;
};

// Helper function to generate the nextPageToken for pagination
const generateNextPageToken = (items, limit, view) => {
	if (items.length < limit) return null;

	const lastItem = items[items.length - 1];
	const tokenData = { createdAt: lastItem.createdAt };

	if (view === 'Top') {
		tokenData.netUpvotes = lastItem.netUpvotes;
	} else if (view === 'Replies' || view === 'Hot') {
		tokenData.rankingScore = lastItem.rankingScore
	}

	return JSON.stringify(tokenData);
};

module.exports = {
	easyParse,
	parseFilters,
	buildCommentQueryAndSort,
	buildPostsQuery,
	generateNextPageToken
}