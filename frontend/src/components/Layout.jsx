import { Link, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { selectUnreadChatCount, selectUnreadPostCount } from "../features/notifications/notificationsSlice";
import { LogOut, Users, User, MessageSquare } from "lucide-react";

export default function Layout() {
  const dispatch = useDispatch();
  const unreadChatCount = useSelector(selectUnreadChatCount);
  const unreadPostCount = useSelector(selectUnreadPostCount);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/groups"
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              HobbyNet
            </Link>
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link
                to="/groups"
                className="relative flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Users className="mr-2" size={18} />
                <span>Groups</span>
                {unreadPostCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {unreadPostCount > 9 ? '9+' : unreadPostCount}
                  </span>
                )}
              </Link>

              <Link
                to="/chat"
                className="relative flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <MessageSquare className="mr-2" size={18} />
                <span>Chat</span>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <User className="mr-2" size={18} />
                Profile
              </Link>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut className="mr-2" size={18} />
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

