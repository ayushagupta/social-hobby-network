import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import groupsReducer from '../features/groups/groupsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupsReducer,
  },
});

export default store;
