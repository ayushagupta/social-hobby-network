import { createSlice } from '@reduxjs/toolkit';
import { loginUser, registerUser } from './authThunks';

// Get user data from localStorage if it exists
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
  // Initialize state with data from localStorage
  user: user || null,
  token: token || null,
  isLoggedIn: !!(user && token),
  // Use a status enum for more descriptive loading states
  status: user ? 'succeeded' : 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Clear data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Reset state to initial values
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, token } = action.payload;

        // Save session to localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);

        state.status = 'succeeded';
        state.user = user;
        state.token = token;
        state.isLoggedIn = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { user, token } = action.payload;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        state.status = 'succeeded';
        state.user = user;
        state.token = token;
        state.isLoggedIn = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.isLoggedIn = false;
        state.error = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.isLoggedIn = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;

// It's good practice to co-locate selectors
export const selectAuth = (state) => state.auth;

export default authSlice.reducer;