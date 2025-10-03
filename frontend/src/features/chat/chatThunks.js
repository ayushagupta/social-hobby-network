import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchChatHistoryAPI, connectWebSocket, sendChatMessage, disconnectWebSocket } from './chatAPI';
import { addMessage } from './chatSlice';

/**
 * An async thunk for a standard REST API call.
 * This fetches the initial message history for a chat room.
 */
export const fetchChatHistory = createAsyncThunk(
  'chat/fetchHistory',
  async (groupId, { rejectWithValue }) => {
    try {
      const history = await fetchChatHistoryAPI(groupId);
      return history;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch chat history');
    }
  }
);

/**
 * A "plain" thunk to handle the long-lived WebSocket connection.
 * This is not an async thunk because it doesn't have a simple start/end state.
 * It sets up a listener that can dispatch actions over time.
 */
export const startChatSession = (groupId) => (dispatch, getState) => {
  const { token } = getState().auth;
  if (!token) {
    console.error("Authentication token not found. Cannot start chat session.");
    return;
  }

  // Define the callback function that will be executed for each incoming message.
  const onMessageCallback = (message) => {
    // Dispatch the action to add the new message to the Redux store.
    dispatch(addMessage(message));
  };

  // Call the API function to establish the connection, passing the callback
  // and the dispatch function so the API layer can update the connection status.
  connectWebSocket(groupId, token, onMessageCallback, dispatch);
};

/**
 * A plain thunk for sending a message.
 * It simply calls the corresponding function from the API layer.
 */
export const sendMessage = (messageContent) => () => {
  sendChatMessage(messageContent);
};

/**
 * A plain thunk for cleanly disconnecting the WebSocket.
 * This should be called when the user navigates away from the chat page.
 */
export const endChatSession = () => () => {
  disconnectWebSocket();
};

