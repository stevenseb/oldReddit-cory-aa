import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createComment } from '../../store/slices/entities/commentSlice';
require('./commentForm.css');

export const CommentForm = (props) => {
	// TODO: ADD EDIT FUNCTIONALITY TO FORM
	const dispatch = useDispatch();
	// let history = useHistory();

	// const commentErrors = useSelector((state) => state.errors.commentErrors);
	const [body, setBody] = useState('');

	const update = (field) => {
		return (e) => {
			const val = e.currentTarget.value;
			switch (field) {
				case 'body':
					setBody(val);
					break;
				default:
					return;
			}
		};
	};

	// const renderErrors = () => {
	// 	return (
	// 		<ul>
	// 			{commentErrors.map((error, idx) => (
	// 				<li key={`error-${idx}`}>{error}</li>
	// 			))}
	// 		</ul>
	// 	);
	// };

	const handleSubmit = async (e) => {
		e.preventDefault();
		const { postId, parentCommentId, onNewReply, parentPath } = props;
		let comment = { postId, body, parentCommentId, parentPath };

		let res = await dispatch(createComment(comment));
		if ((res.type = 'comments/create/fulfilled')) {
			setBody('');
		}

		if (onNewReply) {
			onNewReply(res.payload);
		}
	};

	return (
		<form className="comment-form" onSubmit={handleSubmit}>
			{/* <div className="errors">{renderErrors()}</div> */}
			<textarea
				required
				className="comment-text-area"
				type="text"
				value={body}
				onChange={update('body')}
			/>
			<input className="comment-submit" type="submit" value="Save" />
		</form>
	);
};
