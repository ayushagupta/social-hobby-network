import { createSlice } from '@reduxjs/toolkit';
import { loginUser, registerUser, updateUser } from './authThunks';
import { createGroup, joinGroup, leaveGroup } from '../groups/groupsThunks';

// Get user data from localStorage if it exists
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
  // Initialize state with data from localStorage
  user: user || null,
  token: token || null,
  isLoggedIn: !!(user && token),
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
    // Action to clear the error message from the UI
    clearAuthError: (state) => {
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
      })

      // --- Reducers for Profile Update ---
      .addCase(updateUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // --- Reducers for Group Interactions ---
      .addCase(createGroup.fulfilled, (state, action) => {
        if (state.user && state.user.group_memberships) {
          state.user.group_memberships.push(action.payload.id);
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        if (state.user && state.user.group_memberships) {
          state.user.group_memberships.push(action.payload.groupId);
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        if (state.user && state.user.group_memberships) {
          state.user.group_memberships = state.user.group_memberships.filter(
            (id) => id !== action.payload.groupId
          );
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// It's good practice to co-locate selectors
export const selectAuth = (state) => state.auth;

export default authSlice.reducer;

