import { createSlice, createAsyncThunk, buildCreateSlice } from '@reduxjs/toolkit';
import { createVote } from './votes';
import axios from 'axios';

export const fetchPosts = createAsyncThunk(
	'posts/fetchAll',
	async (filters, { rejectWithValue }) => {
		try {
			let res = await axios.get('/api/posts', filters);
			return res.data;
		} catch (err) {
			return rejectWithValue(err.response.data);
		}
	}
);

export const fetchPost = createAsyncThunk(
	'posts/fetchOne',
	async (id, { rejectWithValue }) => {
		try {
			let res = await axios.get(`/api/posts/${id}`);
			return res.data;
		} catch (err) {
			return rejectWithValue(err.response.data);
		}
	}
);

export const createPost = createAsyncThunk(
	'posts/create',
	async (post, { rejectWithValue }) => {
		try {
			let res = await axios.post('/api/posts', post);
			return res.data;
		} catch (err) {
			return rejectWithValue(err.response.data);
		}
	}
);

export const deletePost = createAsyncThunk(
	'posts/delete',
	async (postId, { rejectWithValue }) => {
		try {
			let res = await axios.delete(`/api/posts/${postId}`);
			return res.data;
		} catch (err) {
			return rejectWithValue(err.response.data);
		}
	}
);

export const updatePost = createAsyncThunk(
	'posts/update',
	async (post, { rejectWithValue }) => {
		try {
			let res = await axios.post(`/api/posts${post._id}`, post);
			return res.data;
		} catch (err) {
			return rejectWithValue(err.response.data);
		}
	}
);

const postSlice = createSlice({
	name: 'posts',
	initialState: {},
	reducers: {},
	extraReducers: (builder) => {
		builder
		.addCase(fetchPosts.fulfilled, (state, action) => {
			action.payload.forEach((subReddit) => {
				state[subReddit._id] = subReddit;
			});
		})
		.addCase(fetchPost.fulfilled, (state, action) => {
			state[action.payload._id] = action.payload;
		})
		.addCase(createPost.fulfilled, (state, action) => {
			state[action.payload._id] = action.payload;
		})
		.addCase(updatePost.fulfilled, (state, action) => {
			delete state[action.payload._id];
		})
		.addCase(deletePost.fulfilled, (state, action) => {
			state[action.payload._id] = action.payload;
		})
		.addCase(createVote.fulfilled, (state, action) => {
			state[action.payload._id] = action.payload;
		})
	},
});

export default postSlice.reducer;
