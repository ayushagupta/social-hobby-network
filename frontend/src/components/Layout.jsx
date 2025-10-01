import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { LogOut, Users, User } from 'lucide-react';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    // No need to navigate here, the PrivateRoutes guard will automatically redirect
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link to="/groups" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                HobbyNet
              </Link>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link
                to="/groups"
                className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Users className="mr-2" size={18} />
                Groups
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
        {/* The current page's content (e.g., GroupsPage, ProfilePage) will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
}
