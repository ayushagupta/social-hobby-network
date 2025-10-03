import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import groupsReducer from '../features/groups/groupsSlice';
import postsReducer from '../features/posts/postsSlice';
import chatReducer from '../features/chat/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupsReducer,
    posts: postsReducer,
    chat: chatReducer
  },
});

export default store;
