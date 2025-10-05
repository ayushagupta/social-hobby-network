import { privateApi } from '../../api';

/**
 * Calls the backend's unified search endpoint.
 * @param {string} query - The search term.
 * @returns {Promise<object>} The search results, categorized by type.
 */
export const searchAPI = async (query) => {
  const response = await privateApi.get(`/search/?q=${encodeURIComponent(query)}`);
  return response.data; // Expected format: { users: [], groups: [], posts: [] }
};
