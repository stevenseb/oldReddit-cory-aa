import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchPosts } from '../../store/slices/entities/postSlice';
import { PostIndexItem } from './postIndexItem';
import { VoteButton } from '../votes/voteButton';
require('./postIndex.css');

export const PostIndex = ({subRedditId}) => {
	const [hooksReady, setHooksReady] = useState(false);
	const [posts, setPosts] = useState([]);
	const [filter, setFilter] = useState({view: "Hot", subRedditId}); // Default filter is "Hot"
	const dispatch = useDispatch();

	useEffect(() => {
		const fetchPostsWithFilter = async () => {
			let res = await dispatch(fetchPosts(filter));
			if (res.type === 'posts/fetchAll/fulfilled') {
				setPosts(Object.values(res.payload));
				setHooksReady(true);
			}
		};
		fetchPostsWithFilter();
	}, [dispatch, filter]);

	if (!hooksReady) return <div></div>;
	console.log(filter)
	const renderPosts = () => {
		return (
			<ul className="post-index">
				{posts.map((post, idx) => (
					<div className="post-container" key={`post${idx}`}>
						<VoteButton postId={post._id} voteCount={post.voteCount} />
						<PostIndexItem post={post} />
					</div>
				))}
			</ul>
		);
	};
	return (
		<div>
			{/* Filter buttons */}
			<div className="post-filters">
				<button onClick={() => setFilter({view: "Hot", subRedditId})}>Hot</button>
				<button onClick={() => setFilter({view: "New", subRedditId})}>New</button>
				<button onClick={() => setFilter({view: "Top", subRedditId})}>Top</button>
			</div>
			{renderPosts()}
		</div>
	);
};
