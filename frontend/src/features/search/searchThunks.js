import { createAsyncThunk } from '@reduxjs/toolkit';
import { searchAPI } from './searchAPI';

export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (query, { rejectWithValue }) => {
    try {
      const results = await searchAPI(query);
      return results;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to perform search');
    }
  }
);
