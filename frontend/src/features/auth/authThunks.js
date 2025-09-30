import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginAPI, getProfileAPI } from './authAPI';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const loginData = await loginAPI(email, password);
      const token = loginData.access_token;

      // Manually set the token in localStorage right after login
      // so the next API call's interceptor can use it.
      localStorage.setItem('token', token);

      // Now getProfileAPI automatically uses the token from the interceptor
      const profileData = await getProfileAPI();
      
      return { token, user: profileData };
    } catch (err) {
      // Clear token if login fails partway through
      localStorage.removeItem('token');
      return rejectWithValue(err.response?.data?.detail || 'Login failed');
    }
  }
);