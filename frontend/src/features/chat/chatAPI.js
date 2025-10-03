import { privateApi } from '../../api';
import { setConnectionStatus } from './chatSlice';

let socket = null;

export const fetchChatHistoryAPI = async (groupId) => {
  const response = await privateApi.get(`/chat/${groupId}`);
  return response.data;
};

// Search for users by name
export const searchUsersAPI = async (query) => {
  const response = await privateApi.get(`/users/search?query=${query}`);
  return response.data;
};

// Get or create a DM channel with a target user
export const startDirectMessageAPI = async (targetUserId) => {
  const response = await privateApi.post(`/chat/dm/${targetUserId}`);
  return response.data;
};

// Fetch all conversations (groups and DMs) for the current user
export const fetchConversationsAPI = async () => {
  const response = await privateApi.get(`/chat/conversations`);
  return response.data;
};

export const connectWebSocket = (groupId, token, onMessageCallback, dispatch) => {
  // Disconnect any existing socket before creating a new one.
  if (socket) {
    // Remove old listeners to prevent the old socket's onclose from interfering.
    socket.onclose = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.close();
  }

  const wsUrl = `ws://localhost:8000/chat/ws/${groupId}?token=${token}`;
  // Use a local variable to ensure event handlers are bound to *this specific* socket.
  const currentSocket = new WebSocket(wsUrl);
  socket = currentSocket; // Update the module-level reference to the new, active socket.

  dispatch(setConnectionStatus('connecting'));

  currentSocket.onopen = () => {
    console.log('WebSocket connected');
    // Only update the status to 'open' if this is still the active socket.
    if (socket === currentSocket) {
      dispatch(setConnectionStatus('open'));
    }
  };

  currentSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onMessageCallback(message);
  };

  currentSocket.onclose = () => {
    console.log('WebSocket disconnected');
    // CRITICAL FIX: Only update status and nullify the socket if this onclose
    // event belongs to the currently active socket. This prevents an old,
    // closing socket from destroying a new, active one.
    if (socket === currentSocket) {
      dispatch(setConnectionStatus('closed'));
      socket = null;
    }
  };

  currentSocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (socket === currentSocket) {
      dispatch(setConnectionStatus('closed'));
      socket = null;
    }
  };
};

export const sendChatMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  } else {
    console.error('WebSocket is not connected.');
  }
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

