import { buildCreateSlice, createSlice } from '@reduxjs/toolkit';
import {
	fetchPost,
	fetchPosts,
	createPost,
	deletePost,
	updatePost,
} from '../entities/postSlice';

const postErrorsSlice = createSlice({
	name: 'postErrors',
	initialState: [],
	reducers: {},
	extraReducers: (builder) => {
		builder
		.addCase(fetchPost.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(fetchPost.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(fetchPosts.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(fetchPosts.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(createPost.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(createPost.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(deletePost.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(deletePost.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(updatePost.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(updatePost.fulfilled, (state, action) => {
			state = [];
		})
	},
});

export default postErrorsSlice.reducer;
