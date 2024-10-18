import React/*, { useState, useEffect, useRef } */from 'react';
import { fetchPosts, clearPosts, selectPostArray } from '../../store/slices/entities/postSlice';
import { PostIndexItem } from './postIndexItem';
import { VoteButton } from '../votes/voteButton';
import PaginatedList from '../paginatedList';
require('./postIndex.css');

export const PostIndex = (props) => {
	const initialFilter = { view: "Hot", subRedditId: props.match.params.id };
	
	return (
		<PaginatedList
			fetchAction={fetchPosts}
			clearAction={clearPosts}
			selectData={selectPostArray}
			initialFilter={initialFilter}
			entityName="posts"
			renderItem={(post, idx) => (
				<div className="post-container" key={`post${idx}`}>
					<span className="rank">{idx+1}</span>
					<VoteButton postId={post._id} netUpvotes={post.netUpvotes} />
					<PostIndexItem post={post} />
				</div>
			)}
		/>
	);
};
