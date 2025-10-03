import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import { useSelector } from "react-redux";
import { selectAuth } from "./features/auth/authSlice";
import Layout from "./components/Layout";
import ChatPage from "./pages/ChatPage";

// Layout for routes only accessible to logged-in users
function PrivateRoutes() {
  const { isLoggedIn, status } = useSelector(selectAuth);

  // FIX: Only show the loading indicator during an active API call (e.g., login).
  // Do not show it for the 'idle' state.
  if (status === "loading") {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If not actively loading, make a decision based purely on login status.
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
        <Route element={<Layout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Route>

      {/* Fallback route - Navigate to a sensible default */}
      <Route path="*" element={<Navigate to="/groups" />} />
    </Routes>
  );
}

export default App;
