import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  unreadChatCount: 0,
  unreadPostCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Actions for chat-related notifications
    incrementUnreadChatCount: (state) => {
      state.unreadChatCount += 1;
    },
    clearUnreadChatCount: (state) => {
      state.unreadChatCount = 0;
    },
    // Actions for post-related notifications
    incrementUnreadPostCount: (state) => {
      state.unreadPostCount += 1;
    },
    clearUnreadPostCount: (state) => {
      state.unreadPostCount = 0;
    },
  },
});

export const {
  incrementUnreadChatCount,
  clearUnreadChatCount,
  incrementUnreadPostCount,
  clearUnreadPostCount,
} = notificationsSlice.actions;

export const selectUnreadChatCount = (state) => state.notifications.unreadChatCount;
export const selectUnreadPostCount = (state) => state.notifications.unreadPostCount;

export default notificationsSlice.reducer;

