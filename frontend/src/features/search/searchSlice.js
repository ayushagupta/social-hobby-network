import { createSlice } from '@reduxjs/toolkit';
import { performSearch } from './searchThunks';

const initialState = {
  results: {
    users: [],
    groups: [],
    posts: [],
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Action to clear search results when navigating away
    clearSearchResults: (state) => {
      state.results = { users: [], groups: [], posts: [] };
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults } = searchSlice.actions;

export const selectSearchResults = (state) => state.search;

export default searchSlice.reducer;
