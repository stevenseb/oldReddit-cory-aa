import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, clearPosts, selectPostArray } from '../../store/slices/entities/postSlice';
import { PostIndexItem } from './postIndexItem';
import { VoteButton } from '../votes/voteButton';
require('./postIndex.css');

export const PostIndex = (props) => {
	const [hooksReady, setHooksReady] = useState(false);
	const posts = useSelector(selectPostArray); // Use the memoized selector
	const [state, setState] = useState({ 
		filter: { view: "Hot", subRedditId: props.match.params.id },
		pageToken: null 
	});
	const dispatch = useDispatch();

	// Update filter whenever the URL changes
	useEffect(() => {
		setState((prevState) => ({
			...prevState,
			filter: {
				...prevState.filter,
				subRedditId: props.match.params.id, // Update subRedditId based on URL
			},
			pageToken: null
		}));
	}, [props.match.params.id]);

	const hasFetched = useRef(false);
	useEffect(() => {

		const fetchPostsWithFilter = async () => {
			if (hasFetched.current) return;  // Prevent running if already fetching
			hasFetched.current = true;

			dispatch(clearPosts())
			let res = await dispatch(fetchPosts({filter: state.filter, pageToken: state.pageToken}));
			if (res.type === 'posts/fetchAll/fulfilled') {
				// Set the new pageToken from the response
            if (res.payload.nextPageToken) {
                setState(prevState => ({
						...prevState,
						pageToken: JSON.parse(res.payload.nextPageToken)
					}));
            }
				setHooksReady(true);
			}
			// Cleanup if component unmounts while fetching
			return () => {
				hasFetched.current = false;
			};
		};
		fetchPostsWithFilter();
	}, [dispatch, state.filter, hooksReady, state.pageToken]);

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

	const loadMorePosts = () => {
		hasFetched.current = false;
		if (state.pageToken) {
			// Trigger the next batch of posts by setting the next pageToken
			setState(prevState => ({
				...prevState,
				pageToken: prevState.pageToken
			}));

		}
	};

	// Filter buttons update the filter and reset pageToken to null
	const handleFilterChange = (newView) => {
		hasFetched.current = false;
		setState({
			filter: { view: newView, subRedditId: props.match.params.id },
			pageToken: null // Reset the pageToken when filter changes
		});
	};
	console.log(state)
	return (
		<div>
			{/* Filter buttons */}
			<div className="post-filters">
				<button onClick={() => handleFilterChange("Hot")}>Hot</button>
				<button onClick={() => handleFilterChange("New")}>New</button>
				<button onClick={() => handleFilterChange("Top")}>Top</button>
			</div>
			{renderPosts()}
			<button onClick={loadMorePosts}>Load More</button>
		</div>
	);
};
