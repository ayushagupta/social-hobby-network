import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPostsForGroupAPI, createPostInGroupAPI } from './postsAPI';

export const fetchPostsForGroup = createAsyncThunk(
  'posts/fetchForGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const posts = await fetchPostsForGroupAPI(groupId);
      return posts;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch posts');
    }
  }
);

export const createPostInGroup = createAsyncThunk(
  'posts/createInGroup',
  async ({ groupId, postData }, { rejectWithValue }) => {
    try {
      const newPost = await createPostInGroupAPI(groupId, postData);
      return newPost;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create post');
    }
  }
);
