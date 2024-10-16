import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchPost } from '../../store/slices/entities/postSlice';
import { CommentIndexItem } from '../comments/commentIndexItem';
import { CommentForm } from '../comments/commentForm';
import { VoteButton } from '../votes/voteButton';
import { useSelector } from 'react-redux';
import { clearComments, fetchComments } from '../../store/slices/entities/commentSlice';

export const PostShow = (props) => {
	let postId = props.match.params.id;
	const [hooksReady, setHooksReady] = useState(false);
	const post = useSelector(state => state?.entities?.posts[props?.match?.params?.id]);
	const comments = useSelector((state) =>
		Object.values(state.entities.comments)
	);
	const dispatch = useDispatch();

	useEffect(() => {
		const fetchPostWithComments = async () => {
			let [postRes, commentsRes] = await Promise.all([
				dispatch(fetchPost(postId)),
				dispatch(fetchComments(postId))
			])

			if (postRes.type === 'posts/fetchOne/fulfilled' && commentsRes.type === 'comments/fetchAll/fulfilled') {
                setHooksReady(true);  // Set hooks ready if both fetches are successful
            }
		};
		
		setHooksReady(false)
		dispatch(clearComments());
		fetchPostWithComments();
		
	}, [dispatch, props.match.params.id]);

	// useEffect(() => {
	// 	setStatefulComments(comments);
	// }, []);
	const renderComments = () => {
		return (
			<ul>
				{comments.map((comment, idx) => (
					<div className="comment-container" key={`comment${idx}`}>
						<VoteButton commentId={comment._id} voteCount={comment.voteCount} />
						<CommentIndexItem comment={comment} />
					</div>
				))}
			</ul>
		);
	};

	if (!hooksReady) return <div></div>;

	return (
		<div>
			<VoteButton postId={post._id} voteCount={post.voteCount} />
			<span>{post.netUpvotes}</span>
			<h1>{post.title}</h1>
			<h2>{post.body}</h2>
			<CommentForm postId={post._id} />
			{renderComments()}
		</div>
	);
};
