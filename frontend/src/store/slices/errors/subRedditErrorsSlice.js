import { createSlice } from '@reduxjs/toolkit';
import {
	fetchSubReddit,
	fetchSubReddits,
	createSubReddit,
	deleteSubReddit,
	updateSubReddit,
} from '../entities/subRedditSlice';

const subRedditErrorsSlice = createSlice({
	name: 'subRedditErrors',
	initialState: [],
	reducers: {},
	extraReducers: (builder) => {
		builder
		.addCase(fetchSubReddit.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(fetchSubReddit.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(fetchSubReddits.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(fetchSubReddits.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(createSubReddit.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(createSubReddit.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(deleteSubReddit.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(deleteSubReddit.fulfilled, (state, action) => {
			state = []
		})
		.addCase(updateSubReddit.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(updateSubReddit.fulfilled, (state, action) => {
			state = [];
		})
	},
});

export default subRedditErrorsSlice.reducer;
