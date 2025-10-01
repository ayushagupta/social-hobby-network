import { publicApi, privateApi } from '../../api';

// Login API (uses the public instance)
export const loginAPI = async (email, password) => {
  const response = await publicApi.post('/auth/login', { email, password });
  return response.data;
};

// Signup API (uses the public instance)
export const signupAPI = async (name, email, password, hobbies) => {
  const response = await publicApi.post('/auth/signup', { name, email, password, hobbies });
  return response.data;
};

// Get profile API (now uses the private instance and doesn't need the token passed in)
export const getProfileAPI = async () => {
  const response = await privateApi.get('/users/me');
  return response.data;
};

// Update current user's profile API
export const updateUserAPI = async (userData) => {
  const response = await privateApi.put('/users/me', userData);
  return response.data;
};