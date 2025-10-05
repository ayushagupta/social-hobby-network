import { useEffect, useState, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAuth } from "../features/auth/authSlice";
import { selectChat, clearChat } from "../features/chat/chatSlice";
import { clearUnreadChatCount } from "../features/notifications/notificationsSlice";
// FIX: We are replacing fetchGroups with fetchConversations
import {
  fetchConversations,
  fetchChatHistory,
  startChatSession,
  endChatSession,
  sendMessage,
  startDirectMessage,
} from "../features/chat/chatThunks";
import { searchUsersAPI } from "../features/chat/chatAPI";
import {
  Send,
  MessageSquare,
  Plus,
  Search,
  X,
  User as UserIcon,
} from "lucide-react";
import Toast from "../components/Toast";

// --- (NewMessageModal component is unchanged) ---
function NewMessageModal({ isOpen, onClose, onSelectUser }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        try {
          const users = await searchUsersAPI(query);
          setResults(users);
        } catch (error) {
          console.error("Failed to search users:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-20">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">New Message</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X />
          </button>
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for a user..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <ul className="mt-4 max-h-60 overflow-y-auto">
          {isLoading && <li className="p-2 text-gray-500">Searching...</li>}
          {!isLoading &&
            results.map((user) => (
              <li
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className="p-3 hover:bg-gray-100 rounded-md cursor-pointer font-medium"
              >
                {user.name}
              </li>
            ))}
          {!isLoading && query && results.length === 0 && (
            <li className="p-2 text-gray-500">No users found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const {
    messages,
    status: chatStatus,
    connectionStatus,
    error,
  } = useSelector(selectChat);

  // FIX: This component now manages its own list of conversations in local state.
  const [myConversations, setMyConversations] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(clearUnreadChatCount());
  }, [dispatch]);

  // FIX: This effect now fetches the user's specific conversations (including DMs).
  useEffect(() => {
    dispatch(fetchConversations())
      .unwrap()
      .then((conversations) => {
        const sorted = conversations.sort((a, b) => {
          if (a.is_direct_message && !b.is_direct_message) return -1;
          if (!a.is_direct_message && b.is_direct_message) return 1;
          return a.name.localeCompare(b.name);
        });
        setMyConversations(sorted);
      })
      .catch(console.error);
  }, [dispatch]);

  // Automatically select the first conversation when the list loads.
  useEffect(() => {
    if (!activeGroupId && myConversations.length > 0) {
      setActiveGroupId(myConversations[0].id);
    }
  }, [myConversations, activeGroupId]);

  // Manage the WebSocket and history fetching for the active chat.
  useEffect(() => {
    if (activeGroupId) {
      dispatch(fetchChatHistory(activeGroupId));
      dispatch(startChatSession(activeGroupId));
    }
    return () => {
      dispatch(endChatSession());
      dispatch(clearChat());
    };
  }, [activeGroupId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const content = e.target.elements.message.value;
    if (content.trim()) {
      dispatch(sendMessage(content));
      e.target.reset();
    }
  };

  const handleStartDm = async (targetUserId) => {
    const resultAction = await dispatch(startDirectMessage(targetUserId));
    if (startDirectMessage.fulfilled.match(resultAction)) {
      const newConvo = resultAction.payload;

      // 1. Optimistically add the new conversation to our local list for an instant UI update.
      setMyConversations((prev) => {
        if (!prev.find((c) => c.id === newConvo.id)) {
          // Add new convo to the top of the list for better UX
          return [newConvo, ...prev];
        }
        return prev;
      });

      // 2. Set the new conversation as active.
      setActiveGroupId(newConvo.id);
    }
    setIsNewMessageModalOpen(false);
  };

  const activeGroup = myConversations.find(
    (group) => group.id === activeGroupId
  );

  const otherUserInDm = useMemo(() => {
    if (activeGroup?.is_direct_message) {
      return activeGroup.members?.find((member) => member.id !== user.id);
    }
    return null;
  }, [activeGroup, user]);

  const isConnecting = connectionStatus === "connecting";
  const isConnected = connectionStatus === "open";

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {error && (
        <Toast
          message={error}
          onClose={() => {
            /* clearChatError needed */
          }}
        />
      )}
      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onSelectUser={handleStartDm}
      />

      <aside className="w-1/4 bg-white border-r overflow-y-auto">
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Conversations</h2>
          <button
            onClick={() => setIsNewMessageModalOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <Plus />
          </button>
        </header>
        <ul>
          {myConversations.map((group) => {
            let displayName = group.name;
            let subtext = group.is_direct_message
              ? "Direct Message"
              : group.hobby;
            if (group.is_direct_message) {
              const otherMember = group.members?.find((m) => m.id !== user.id);
              displayName = otherMember ? otherMember.name : "Direct Message";
            }

            return (
              <li key={group.id}>
                <button
                  onClick={() => setActiveGroupId(group.id)}
                  className={`w-full text-left p-4 hover:bg-gray-100 ${
                    activeGroupId === group.id
                      ? "bg-blue-100 font-semibold"
                      : ""
                  }`}
                >
                  <p className="flex items-center gap-2">
                    {group.is_direct_message && (
                      <UserIcon size={16} className="text-gray-500" />
                    )}
                    {displayName}
                  </p>
                  <p className="text-sm text-gray-500 pl-6">{subtext}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="w-3/4 flex flex-col bg-gray-50">
        {activeGroup ? (
          <>
            <header className="p-4 border-b bg-white shadow-sm">
              <h2 className="text-xl font-bold">
                {otherUserInDm ? otherUserInDm.name : activeGroup.name}
              </h2>
            </header>

            <div className="flex-1 p-4 overflow-y-auto">
              {chatStatus === "loading" && (
                <p className="text-center text-gray-500">Loading history...</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-4 ${
                    msg.user.id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-lg ${
                      msg.user.id === user.id
                        ? "bg-blue-500 text-white"
                        : "bg-white shadow-sm"
                    }`}
                  >
                    {msg.user.id !== user.id && (
                      <p className="text-sm font-semibold mb-1">
                        {msg.user.name}
                      </p>
                    )}
                    <p>{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.user.id === user.id
                          ? "text-blue-200"
                          : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                  placeholder={
                    isConnecting ? "Connecting to chat..." : "Type a message..."
                  }
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
            <p className="mt-4 text-lg">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
