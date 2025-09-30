import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import { useSelector } from "react-redux";
import { selectAuth } from "./features/auth/authSlice";

// Layout for routes only accessible to logged-in users
function PrivateRoutes() {
  const { isLoggedIn, status } = useSelector(selectAuth);

  // Show a loading state while Redux initializes
  if (status === 'idle' || status === 'loading') {
    return <div>Loading...</div>; // Or a spinner component
  }

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}

// Layout for routes only accessible to logged-out users
function PublicRoutes() {
  const { isLoggedIn } = useSelector(selectAuth);
  // Redirect to a default page if the user is already logged in
  return isLoggedIn ? <Navigate to="/groups" replace /> : <Outlet />;
}

function App() {
  return (
    <Routes>
      {/* Public routes (Login, Signup) */}
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Private routes (Profile, Groups, etc.) */}
      <Route element={<PrivateRoutes />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
      </Route>

      {/* Fallback route - Navigate to a sensible default */}
      <Route path="*" element={<Navigate to="/groups" />} />
    </Routes>
  );
}

export default App;