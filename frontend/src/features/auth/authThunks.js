import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginAPI, getProfileAPI, signupAPI } from './authAPI';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const loginData = await loginAPI(email, password);
      const token = loginData.access_token;

      // Manually set the token in localStorage right after login so the next API call's interceptor can use it.
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

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password, hobbies }, { dispatch, rejectWithValue }) => {
    try {
      // Create the new user account
      await signupAPI(name, email, password, hobbies);

      // Automatically log the user in after successful registration
      // We can dispatch the existing loginUser thunk to handle the login flow
      const resultAction = await dispatch(loginUser({ email, password }));

      // Check if the login was successful and return its payload
      if (loginUser.fulfilled.match(resultAction)) {
        return resultAction.payload; // { token, user }
      } else {
        throw resultAction.payload;
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err || 'Signup failed');
    }
  }
);