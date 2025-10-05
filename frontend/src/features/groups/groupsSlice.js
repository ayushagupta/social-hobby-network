import { createSlice } from "@reduxjs/toolkit";
import { fetchGroups, createGroup, updateGroup } from "./groupsThunks";
import { startDirectMessage } from "../chat/chatThunks";

const initialState = {
  items: [], // Caches the list of all groups
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    // We no longer need clearCurrentGroup
    clearGroupError: (state) => {
      state.error = null;
    },
    addConversation: (state, action) => {
      const newGroup = action.payload;
      // Add the new DM/group to the state if it's not already there.
      const groupExists = state.items.some(group => group.id === newGroup.id);
      if (!groupExists) {
        state.items.push(newGroup);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(createGroup.pending, (state) => {
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Logic to update a group in the master list if it's edited
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (group) => group.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      .addCase(startDirectMessage.fulfilled, (state, action) => {
        const newGroup = action.payload;
        if (!state.items.find((group) => group.id === newGroup.id)) {
          state.items.push(newGroup);
        }
      });
  },
});

export const { clearGroupError, addConversation } = groupsSlice.actions;
export const selectGroups = (state) => state.groups;
export default groupsSlice.reducer;
