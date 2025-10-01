import { privateApi } from '../../api';

// Fetch all available groups
export const fetchGroupsAPI = async () => {
  const response = await privateApi.get('/groups/');
  return response.data;
};

// Fetch a single group by its ID
export const getGroupAPI = async (groupId) => {
  const response = await privateApi.get(`/groups/${groupId}`);
  return response.data;
};

// Create a new group
export const createGroupAPI = async (groupData) => {
  const response = await privateApi.post('/groups/', groupData);
  return response.data;
};

// Join a group by its ID
export const joinGroupAPI = async (groupId) => {
  const response = await privateApi.post(`/memberships/join?group_id=${groupId}`);
  return response.data;
};

// Leave a group by its ID
export const leaveGroupAPI = async (groupId) => {
  const response = await privateApi.post(`/memberships/leave?group_id=${groupId}`);
  return response.data;
};

// Update a group's details
export const updateGroupAPI = async (groupId, groupData) => {
  const response = await privateApi.put(`/groups/${groupId}`, groupData);
  return response.data;
};

// Get all members for a specific group
export const getGroupMembersAPI = async (groupId) => {
  const response = await privateApi.get(`/memberships/group/${groupId}/members`);
  return response.data;
};
