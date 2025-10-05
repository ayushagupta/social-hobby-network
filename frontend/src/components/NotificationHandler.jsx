import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuth, addGroupMembership } from '../features/auth/authSlice';
import { addConversation } from '../features/groups/groupsSlice';
import { incrementUnreadChatCount, incrementUnreadPostCount } from '../features/notifications/notificationsSlice';
import { connectNotificationSocket, disconnectNotificationSocket } from '../features/notifications/notificationAPI';

export default function NotificationHandler() {
  const dispatch = useDispatch();
  const { token } = useSelector(selectAuth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      const handleNotification = (notification) => {
        console.log('Received notification:', notification);
        
        switch (notification.type) {
          case 'NEW_CONVERSATION':
            dispatch(addConversation(notification.payload));
            dispatch(addGroupMembership(notification.payload.id));
            dispatch(incrementUnreadChatCount());
            break;
          
          case 'NEW_MESSAGE':
            dispatch(incrementUnreadChatCount());
            break;
            
          case 'NEW_POST':
            dispatch(incrementUnreadPostCount());
            break;

          default:
            console.warn('Unknown notification type received:', notification.type);
        }
      };

      socketRef.current = connectNotificationSocket(token, handleNotification);
    }

    return () => {
      disconnectNotificationSocket(socketRef.current);
    };
  }, [token, dispatch]);

  return null;
}

