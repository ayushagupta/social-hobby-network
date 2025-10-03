import { createSlice } from '@reduxjs/toolkit';
import { fetchPostsForGroup, createPostInGroup } from './postsThunks';

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Action to clear posts when navigating away from a group page
    clearPosts: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetching posts
      .addCase(fetchPostsForGroup.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPostsForGroup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPostsForGroup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Creating a post
      .addCase(createPostInGroup.fulfilled, (state, action) => {
        // Add the new post to the top of the list for an instant UI update
        state.items.unshift(action.payload);
      });
  },
});

export const { clearPosts } = postsSlice.actions;
export const selectPosts = (state) => state.posts;
export default postsSlice.reducer;
