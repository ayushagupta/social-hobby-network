import axios from 'axios';

// Create a public API instance for non-authenticated requests
export const publicApi = axios.create({
  baseURL: 'http://localhost:8000',
});

// Create a private API instance for authenticated routes
export const privateApi = axios.create({
  baseURL: 'http://localhost:8000',
});

// --- Request Interceptor (adds the token to outgoing requests) ---
privateApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// We will set up the response interceptor in a separate function
export const setupResponseInterceptor = (store, logoutAction) => {
  privateApi.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check if the error is specifically a 401 Unauthorized error
      if (error.response && error.response.status === 401) {
        // Dispatch the logout action to clear user state
        store.dispatch(logoutAction());
        // We don't need to force a redirect here, the routing logic in App.jsx will handle it
      }
      // For any other error, just return the promise so it can be handled locally
      return Promise.reject(error);
    }
  );
};
