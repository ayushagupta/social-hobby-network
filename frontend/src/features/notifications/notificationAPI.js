/**
 * Creates and returns a new WebSocket connection for notifications.
 * This function no longer manages a singleton instance.
 * @param {string} token - The user's JWT for authentication.
 * @param {function} onNotificationCallback - The function to call when a notification is received.
 * @returns {WebSocket} The newly created WebSocket instance.
 */
export const connectNotificationSocket = (token, onNotificationCallback) => {
  const wsUrl = `ws://localhost:8000/notifications/ws?token=${token}`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('Notification WebSocket connected.');
  };

  socket.onmessage = (event) => {
    try {
      const notification = JSON.parse(event.data);
      onNotificationCallback(notification);
    } catch (error) {
      console.error('Failed to parse notification:', error);
    }
  };

  socket.onclose = () => {
    console.log('Notification WebSocket disconnected.');
  };

  socket.onerror = (error) => {
    console.error('Notification WebSocket error:', error);
  };

  return socket;
};

/**
 * Disconnects a given WebSocket instance.
 * @param {WebSocket} socket - The WebSocket instance to close.
 */
export const disconnectNotificationSocket = (socket) => {
  if (socket) {
    // Remove event handlers to prevent them from firing during cleanup
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
  }
};

