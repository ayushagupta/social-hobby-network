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
import SearchPage from "./pages/SearchPage";
import NotificationHandler from "./components/NotificationHandler";

// Layout for routes only accessible to logged-in users
function PrivateRoutes() {
  const { isLoggedIn, status } = useSelector(selectAuth);

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // If the user is logged in, render the NotificationHandler (which has no UI)
  // and then render the rest of the protected pages via the <Outlet />.
  // Otherwise, redirect to the login page.
  return isLoggedIn ? (
    <>
      <NotificationHandler />
      <Outlet />
    </>
  ) : (
    <Navigate to="/login" replace />
  );
}

// Layout for routes only accessible to logged-out users
function PublicRoutes() {
  const { isLoggedIn } = useSelector(selectAuth);
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

      {/* PrivateRoutes */}
      <Route element={<PrivateRoutes />}>
        <Route element={<Layout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route index element={<Navigate to="/groups" />} />
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;

