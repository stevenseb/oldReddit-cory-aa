import React from 'react';
import { CommentForm } from './commentForm';

export const CommentIndexItem = ({ comment }) => {
	const renderChildComments = () => (
		<ul>
			{comment.children &&
				comment.children.map((comment, idx) => (
					<CommentIndexItem key={`com${idx}`} comment={comment} />
				))}
		</ul>
	);
	return (
		<li>
			{comment.body}
			<CommentForm postId={comment.postId} parentCommentId={comment._id} />
			{renderChildComments()}
			{/* <button onClick={handleDelete}>Delete</button> */}
		</li>
	);
};
