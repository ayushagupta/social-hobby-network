import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchGroupsAPI,
  getGroupAPI,
  createGroupAPI,
  joinGroupAPI,
  leaveGroupAPI,
  updateGroupAPI,
  getGroupMembersAPI,
} from './groupsAPI';

export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const groups = await fetchGroupsAPI();
      return groups;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch groups');
    }
  }
);

export const fetchGroupById = createAsyncThunk('groups/fetchGroupById', async (groupId, { rejectWithValue }) => {
  try {
    return await getGroupAPI(groupId);
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch group details');
  }
});

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const newGroup = await createGroupAPI(groupData);
      return newGroup;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create group');
    }
  }
);

export const joinGroup = createAsyncThunk(
  'groups/joinGroup',
  async (groupId, { getState, rejectWithValue }) => {
    try {
      await joinGroupAPI(groupId);
      const { user } = getState().auth; // Get current user from auth state
      return { groupId, user }; // Return user object along with groupId
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to join group');
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async (groupId, { getState, rejectWithValue }) => {
    try {
      await leaveGroupAPI(groupId);
      const { user } = getState().auth; // Get current user for their ID
      return { groupId, userId: user.id }; // Return userId for easy filtering
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to leave group');
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async ({ groupId, groupData }, { rejectWithValue }) => {
    try {
      const updatedGroup = await updateGroupAPI(groupId, groupData);
      return updatedGroup;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update group');
    }
  }
);

export const fetchGroupMembers = createAsyncThunk(
  'groups/fetchGroupMembers',
  async (groupId, { rejectWithValue }) => {
    try {
      const members = await getGroupMembersAPI(groupId);
      return members;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch group members');
    }
  }
);