import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import { loginUser, registerUser, updateUser } from "./authThunks";
import { createGroup, joinGroup, leaveGroup } from "../groups/groupsThunks";
import { startDirectMessage } from "../chat/chatThunks";

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

const initialState = {
  user: user || null,
  token: token || null,
  isLoggedIn: !!(user && token),
  status: user ? "succeeded" : "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.status = "idle";
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reducers for Profile Update
      .addCase(updateUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Reducers for Group Interactions
      .addCase(createGroup.fulfilled, (state, action) => {
        if (state.user?.group_memberships) {
          state.user.group_memberships.push(action.payload.id);
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        if (state.user?.group_memberships) {
          state.user.group_memberships.push(action.payload.groupId);
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        if (state.user?.group_memberships) {
          state.user.group_memberships = state.user.group_memberships.filter(
            (id) => id !== action.payload.groupId
          );
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(startDirectMessage.fulfilled, (state, action) => {
        const newGroup = action.payload;
        if (
          state.user?.group_memberships &&
          !state.user.group_memberships.includes(newGroup.id)
        ) {
          state.user.group_memberships.push(newGroup.id);
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })

      // CLEANUP: Use `addMatcher` to handle shared logic for login/register
      .addMatcher(isAnyOf(loginUser.pending, registerUser.pending), (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addMatcher(
        isAnyOf(loginUser.fulfilled, registerUser.fulfilled),
        (state, action) => {
          const { user, token } = action.payload;
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);
          state.status = "succeeded";
          state.user = user;
          state.token = token;
          state.isLoggedIn = true;
        }
      )
      .addMatcher(
        isAnyOf(loginUser.rejected, registerUser.rejected),
        (state, action) => {
          state.status = "failed";
          state.isLoggedIn = false;
          state.error = action.payload;
        }
      );
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export default authSlice.reducer;
