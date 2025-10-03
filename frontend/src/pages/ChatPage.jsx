import { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '../features/auth/authSlice';
import { selectGroups } from '../features/groups/groupsSlice';
import { selectChat, clearChat } from '../features/chat/chatSlice';
import { fetchGroups } from '../features/groups/groupsThunks';
import { fetchChatHistory, startChatSession, endChatSession, sendMessage } from '../features/chat/chatThunks';
import { Send, MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const { items: allGroups, status: groupsStatus } = useSelector(selectGroups);
  const { messages, status: chatStatus, connectionStatus } = useSelector(selectChat);
  
  const [activeGroupId, setActiveGroupId] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch all groups if they aren't in the state yet
  useEffect(() => {
    if (groupsStatus === 'idle') {
      dispatch(fetchGroups());
    }
  }, [groupsStatus, dispatch]);

  const myConversations = useMemo(() => {
    if (user?.group_memberships) {
      return allGroups.filter(group => user.group_memberships.includes(group.id));
    }
    return [];
  }, [allGroups, user]);

  // This effect automatically selects the first conversation when the list loads.
  useEffect(() => {
    if (!activeGroupId && myConversations.length > 0) {
      setActiveGroupId(myConversations[0].id);
    }
  }, [myConversations, activeGroupId]);

  // --- THIS IS THE FIX ---
  // This effect is now structured to prevent race conditions.
  useEffect(() => {
    if (activeGroupId) {
      // We start the new session immediately. The pending state of fetchChatHistory
      // will handle clearing the old messages from view.
      dispatch(fetchChatHistory(activeGroupId));
      dispatch(startChatSession(activeGroupId));
    }

    // The cleanup function now only runs when the component unmounts
    // or before the effect runs for a *new* activeGroupId.
    // This correctly disconnects the *previous* session's socket.
    return () => {
      dispatch(endChatSession());
    };
  }, [activeGroupId, dispatch]);


  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const content = e.target.elements.message.value;
    if (content.trim()) {
      dispatch(sendMessage(content));
      e.target.reset();
    }
  };

  const activeGroup = allGroups.find(group => group.id === activeGroupId);

  const isConnecting = connectionStatus === 'connecting';
  const isConnected = connectionStatus === 'open';

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel: Conversation List */}
      <aside className="w-1/4 bg-white border-r overflow-y-auto">
        <header className="p-4 border-b">
          <h2 className="text-xl font-bold">Conversations</h2>
        </header>
        <ul>
          {myConversations.map(group => (
            <li key={group.id}>
              <button
                onClick={() => setActiveGroupId(group.id)}
                className={`w-full text-left p-4 hover:bg-gray-100 ${activeGroupId === group.id ? 'bg-blue-100 font-semibold' : ''}`}
              >
                <p>{group.name}</p>
                <p className="text-sm text-gray-500">{group.hobby}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right Panel: Active Chat Window */}
      <main className="w-3/4 flex flex-col bg-gray-50">
        {activeGroup ? (
          <>
            <header className="p-4 border-b bg-white shadow-sm">
              <h2 className="text-xl font-bold">{activeGroup.name}</h2>
            </header>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {chatStatus === 'loading' && <p className="text-center text-gray-500">Loading history...</p>}
              {messages.map(msg => (
                <div key={msg.id} className={`flex mb-4 ${msg.user.id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 max-w-lg ${msg.user.id === user.id ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>
                    {msg.user.id !== user.id && <p className="text-sm font-semibold mb-1">{msg.user.name}</p>}
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.user.id === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input
                  type="text"
                  name="message"
                  placeholder={isConnecting ? "Connecting to chat..." : "Type a message..."}
                  autoComplete="off"
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={!isConnected}
                >
                  <Send size={18} /> Send
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-500">
            <MessageSquare size={48} />
            <p className="mt-4 text-lg">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}

