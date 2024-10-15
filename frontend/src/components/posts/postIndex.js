import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, clearPosts } from '../../store/slices/entities/postSlice';
import { PostIndexItem } from './postIndexItem';
import { VoteButton } from '../votes/voteButton';
require('./postIndex.css');

export const PostIndex = (props) => {
	const [hooksReady, setHooksReady] = useState(false);
	const posts = useSelector((state) => {	
		return state?.entities?.posts ? Object.values(state.entities.posts) : [];
	});
	const [filter, setFilter] = useState({view: "Hot", subRedditId: props.match.params.id}); // Default filter is "Hot"
	const dispatch = useDispatch();

	// Update filter whenever the URL changes
	useEffect(() => {
		setFilter((prevFilter) => ({
			...prevFilter,
			subRedditId: props.match.params.id, // Update subRedditId based on URL
		}));
	}, [props.match.params.id]);

	useEffect(() => {
		const fetchPostsWithFilter = async () => {
			dispatch(clearPosts())
			let res = await dispatch(fetchPosts(filter));
			if (res.type === 'posts/fetchAll/fulfilled') {
				// setPosts(Object.values(res.payload));
				setHooksReady(true);
			}
		};
		fetchPostsWithFilter();
	}, [dispatch, filter]);

	if (!hooksReady) return <div></div>;
	
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
				<button onClick={() => setFilter({view: "Hot", subRedditId: props.match.params.id})}>Hot</button>
				<button onClick={() => setFilter({view: "New", subRedditId: props.match.params.id})}>New</button>
				<button onClick={() => setFilter({view: "Top", subRedditId: props.match.params.id})}>Top</button>
			</div>
			{renderPosts()}
		</div>
	);
};
