import React, { useState } from 'react';
import { CommentForm } from './commentForm';
import { VoteButton } from '../votes/voteButton';
import axios from 'axios';

export const CommentIndexItem = ({ comment }) => {
	// State to track loaded replies and nextPageToken for replies
	const [loadedReplies, setLoadedReplies] = useState(comment.replies || []);
	const [replyNextPageToken, setReplyNextPageToken] = useState(comment.replyNextPageToken || null);
	const [loadingReplies, setLoadingReplies] = useState(false);

	// Function to load more replies
	const loadMoreReplies = async () => {
		if (!replyNextPageToken || loadingReplies) return;

		setLoadingReplies(true);

		try {
			const res = await axios.get(`/api/comments/${comment._id}/replies`, {
				params: {
					pageToken: replyNextPageToken,
				},
			});

			// Update state with newly loaded replies
			setLoadedReplies((prevReplies) => [...prevReplies, ...res.data.replies]);
			console.log("RETURN FROM REPLIES: ", res.data)
			// if (res.data.replyNextPageToken) {
				setReplyNextPageToken(res.data.replyNextPageToken);
			// } else if (res.data.nextPageToken) {
			// 	setReplyNextPageToken(res.data.nextPageToken)
			// }
		} catch (error) {
			console.error('Error loading more replies:', error);
		} finally {
			setLoadingReplies(false);
		}
	};

	// Render child comments (replies)
	const renderChildComments = () => (
		<ul>
			{loadedReplies.map((reply, idx) => (
				<div className="comment-container" key={`comment${idx}`}>
					<VoteButton commentId={reply._id} netUpvotes={reply.netUpvotes} />
					<CommentIndexItem key={`com${idx}`} comment={reply} />
				</div>
			))}
		</ul>
	);

	const handleNewReply = (newReply) => {
		setLoadedReplies((prevReplies) => [...prevReplies, newReply]);
	};

	return (
		<li>
			<div className="comment-body">{comment.body}</div>

			<CommentForm postId={comment.postId} parentCommentId={comment._id} onNewReply={handleNewReply} />

			{renderChildComments()}

			{replyNextPageToken && (
				<button onClick={loadMoreReplies} disabled={loadingReplies}>
					{loadingReplies ? 'Loading...' : 'Load more replies'}
				</button>
			)}
		</li>
	);
};
