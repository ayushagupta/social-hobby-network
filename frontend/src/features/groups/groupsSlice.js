import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchGroups, 
  createGroup, 
  updateGroup, 
  fetchGroupMembers, 
  fetchGroupById,
  joinGroup,
  leaveGroup
} from './groupsThunks';

const initialState = {
  items: [], // Caches the list of all groups
  status: 'idle', // Status for the main list: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  // State for the Group Detail Page
  currentGroup: null, // Holds the details of the currently viewed group
  currentGroupStatus: 'idle', // Status for fetching a single group
  currentGroupMembers: [], // Holds the members of the currently viewed group
  membersStatus: 'idle', // Status for fetching members
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    // Action to reset the detail page state when the user navigates away
    clearCurrentGroup: (state) => {
      state.error = null;
      state.currentGroup = null;
      state.currentGroupStatus = 'idle';
      state.currentGroupMembers = [];
      state.membersStatus = 'idle';
    },
    // Action to manually clear the error message
    clearGroupError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- PENDING STATES: Clear previous errors and set loading ---
      .addCase(fetchGroups.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(createGroup.pending, (state) => { state.error = null; })
      .addCase(joinGroup.pending, (state) => { state.error = null; })
      .addCase(leaveGroup.pending, (state) => { state.error = null; })
      .addCase(fetchGroupById.pending, (state) => { state.currentGroupStatus = 'loading'; state.error = null; })
      .addCase(fetchGroupMembers.pending, (state) => { state.membersStatus = 'loading'; state.error = null; })

      // --- FULFILLED STATES ---
      .addCase(fetchGroups.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(createGroup.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.items.findIndex((group) => group.id === action.payload.id);
        if (index !== -1) { state.items[index] = action.payload; }
        if (state.currentGroup && state.currentGroup.id === action.payload.id) { state.currentGroup = action.payload; }
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => { state.currentGroupStatus = 'succeeded'; state.currentGroup = action.payload; })
      .addCase(fetchGroupMembers.fulfilled, (state, action) => { state.membersStatus = 'succeeded'; state.currentGroupMembers = action.payload; })
      .addCase(joinGroup.fulfilled, (state, action) => {
        if (state.currentGroup?.id === action.payload.groupId) {
          const userExists = state.currentGroupMembers.some(member => member.id === action.payload.user.id);
          if (!userExists) { state.currentGroupMembers.push(action.payload.user); }
        }
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        if (state.currentGroup?.id === action.payload.groupId) {
          state.currentGroupMembers = state.currentGroupMembers.filter((member) => member.id !== action.payload.userId);
        }
      })

      // --- REJECTED STATES: Set the error message ---
      .addCase(fetchGroups.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(createGroup.rejected, (state, action) => { state.error = action.payload; })
      .addCase(joinGroup.rejected, (state, action) => { state.error = action.payload; })
      .addCase(leaveGroup.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchGroupById.rejected, (state, action) => { state.currentGroupStatus = 'failed'; state.error = action.payload; })
      .addCase(fetchGroupMembers.rejected, (state, action) => { state.membersStatus = 'failed'; state.error = action.payload; });
  },
});

export const { clearCurrentGroup, clearGroupError } = groupsSlice.actions;
export const selectGroups = (state) => state.groups;
export default groupsSlice.reducer;

