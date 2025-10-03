import { createSlice } from '@reduxjs/toolkit';
import { fetchChatHistory } from './chatThunks';

const initialState = {
  messages: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  connectionStatus: 'closed', // 'closed' | 'connecting' | 'open'
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      // Add a check to prevent duplicate messages from being added, just in case
      if (!state.messages.find(msg => msg.id === action.payload.id)) {
        state.messages.push(action.payload);
      }
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = action.payload;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { addMessage, clearChat, setConnectionStatus } = chatSlice.actions;
export const selectChat = (state) => state.chat;
export default chatSlice.reducer;

