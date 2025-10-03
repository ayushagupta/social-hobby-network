import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchChatHistoryAPI,
  connectWebSocket,
  sendChatMessage,
  disconnectWebSocket,
  startDirectMessageAPI,
  fetchConversationsAPI
} from "./chatAPI";
import { addMessage } from "./chatSlice";

/**
 * An async thunk for a standard REST API call.
 * This fetches the initial message history for a chat room.
 */
export const fetchChatHistory = createAsyncThunk(
  "chat/fetchHistory",
  async (groupId, { rejectWithValue }) => {
    try {
      const history = await fetchChatHistoryAPI(groupId);
      return history;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch chat history"
      );
    }
  }
);

export const startDirectMessage = createAsyncThunk(
  "chat/startDirectMessage",
  async (targetUserId, { rejectWithValue }) => {
    // Log #1: Check if the thunk starts and receives the correct user ID.
    console.log(
      `[DEBUG] startDirectMessage thunk initiated for user ID: ${targetUserId}`
    );

    try {
      // Log #2: Check right before the API call is made.
      console.log("[DEBUG] Attempting to call startDirectMessageAPI...");

      const group = await startDirectMessageAPI(targetUserId);

      // Log #3: This will only run if the API call is successful.
      console.log("[DEBUG] API call successful. Received group:", group);

      return group;
    } catch (err) {
      // Log #4: This will run if any error occurs in the `try` block.
      // We log the entire error object to see the full details.
      console.error("[DEBUG] Error caught in startDirectMessage thunk:", err);

      return rejectWithValue(
        err.response?.data?.detail || "Failed to start direct message"
      );
    }
  }
);

// Thunk to fetch all of a user's conversations
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const conversations = await fetchConversationsAPI();
      return conversations;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch conversations"
      );
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
