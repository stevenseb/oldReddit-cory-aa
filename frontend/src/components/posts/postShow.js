import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchPost } from '../../store/slices/entities/postSlice';
import { CommentIndexItem } from '../comments/commentIndexItem';
import { CommentForm } from '../comments/commentForm';
import { VoteButton } from '../votes/voteButton';
import { useSelector } from 'react-redux';
import { clearComments } from '../../store/slices/entities/commentSlice';

export const PostShow = (props) => {
	let postId = props.match.params.id;
	const [hooksReady, setHooksReady] = useState(false);
	const post = useSelector(state => state?.entities?.posts[props?.match?.params?.id]);
	const comments = useSelector((state) =>
		Object.values(state.entities.comments)
	);
	// const [statefulComments, setStatefulComments] = useState([]);

	const dispatch = useDispatch();
	useEffect(() => {
		const fetchOnePost = async () => {
			let res = await dispatch(fetchPost(postId));
			if (res.type === 'posts/fetchOne/fulfilled') {
				setHooksReady(true);
			}
		};
		if (post?._id != postId) {
			dispatch(clearComments());
			fetchOnePost();
		}
	}, [post, dispatch, postId]);

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
	console.log("HOOKS READY", post)

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
