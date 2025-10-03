import { privateApi } from '../../api';

// Fetch all posts for a specific group
export const fetchPostsForGroupAPI = async (groupId) => {
  const response = await privateApi.get(`/groups/${groupId}/posts/`);
  return response.data;
};

// Create a new post in a specific group
export const createPostInGroupAPI = async (groupId, postData) => {
  const response = await privateApi.post(`/groups/${groupId}/posts/`, postData);
  return response.data;
};
