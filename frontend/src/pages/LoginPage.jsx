import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authThunks";
import { useNavigate } from "react-router-dom";
import { selectAuth } from "../features/auth/authSlice"; // Import the selector

export default function LoginPage() {
  // ... (useState and other hooks remain the same) ...
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Use the selector for consistency
  const { status, error, isLoggedIn } = useSelector(selectAuth);
  const isLoading = status === 'loading'; // Derive isLoading from status

  useEffect(() => {
    if (isLoggedIn) {
      // FIX: Navigate to a route that actually exists, like "/groups"
      navigate("/groups", { replace: true });
    }
  }, [isLoggedIn, navigate]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded mb-4"
        />

        <label className="block mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded mb-4"
        />

        <button
          type="submit"
          disabled={isLoading} // Use derived isLoading
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}