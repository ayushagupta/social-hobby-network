import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { logout } from '../features/auth/authSlice';
import { selectUnreadChatCount, selectUnreadPostCount } from '../features/notifications/notificationsSlice';
import { LogOut, Users, User, MessageSquare, Search } from 'lucide-react';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const unreadChatCount = useSelector(selectUnreadChatCount);
  const unreadPostCount = useSelector(selectUnreadPostCount);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/groups" className="text-2xl font-bold text-blue-600">HobbyNet</Link>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for users, groups, or posts..."
                  className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </form>
            </div>

            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link to="/groups" className="relative flex items-center text-gray-600 hover:text-blue-600">
                <Users className="mr-2" size={18} /> Groups
                {unreadPostCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">{unreadPostCount > 9 ? '9+' : unreadPostCount}</span>
                )}
              </Link>
              <Link to="/chat" className="relative flex items-center text-gray-600 hover:text-blue-600">
                <MessageSquare className="mr-2" size={18} /> Chat
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>
                )}
              </Link>
              <Link to="/profile" className="flex items-center text-gray-600 hover:text-blue-600">
                <User className="mr-2" size={18} /> Profile
              </Link>
            </div>
            <div className="flex items-center ml-4">
              <button onClick={handleLogout} className="flex items-center bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 px-4 py-2 rounded-md text-sm font-medium">
                <LogOut className="mr-2" size={18} /> Logout
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

