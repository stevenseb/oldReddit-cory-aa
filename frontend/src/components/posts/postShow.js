import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchPost } from '../../store/slices/entities/postSlice';
import { CommentIndex } from '../comments/commentIndex';
import { CommentForm } from '../comments/commentForm';
import { VoteButton } from '../votes/voteButton';
import { useSelector } from 'react-redux';
import { clearComments, fetchComments } from '../../store/slices/entities/commentSlice';

export const PostShow = (props) => {
	let postId = props.match.params.id;
	const [hooksReady, setHooksReady] = useState(false);
	const post = useSelector(state => state?.entities?.posts[props?.match?.params?.id]);
	
	const dispatch = useDispatch();

	useEffect(() => {
		const fetchOnePost = async () => {
			let postRes = await dispatch(fetchPost(postId));	
			if (postRes.type === 'posts/fetchOne/fulfilled') {
                setHooksReady(true); 
            }
		};
		
		setHooksReady(false)
		dispatch(clearComments());
		fetchOnePost();
		
	}, [dispatch, props.match.params.id]);

	if (!hooksReady) return <div>Loading...</div>;

	return (
		<div>
			<VoteButton postId={post._id} netUpvotes={post.netUpvotes} />
			<h1>{post.title}</h1>
			<h2>{post.body}</h2>
			<CommentForm postId={post._id} />
			<CommentIndex postId={post._id}/>
		</div>
	);
};
