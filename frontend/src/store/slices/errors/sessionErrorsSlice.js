import { createSlice } from '@reduxjs/toolkit';
import { loginUser, signUpUser } from '../sessionSlice';

const sessionErrorsSlice = createSlice({
	name: 'sessionErrors',
	initialState: [],
	reducers: {},
	extraReducers: (builder) => {
		builder
		.addCase(loginUser.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(loginUser.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
		.addCase(signUpUser.fulfilled, (state, action) => {
			state = [];
		})
		.addCase(signUpUser.rejected, (state, action) => {
			state = Object.values(action.payload);
		})
	},
});

export const { getErrors } = sessionErrorsSlice.actions;

export default sessionErrorsSlice.reducer;
