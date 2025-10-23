import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login action
    setAuth: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },

    // Logout action
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },

    // Update user
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },

    // Set loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Restore from localStorage (for initialization)
    restoreAuth: (state, action: PayloadAction<{ user: AuthUser | null; token: string | null }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
    },
  },
});

export const { setAuth, clearAuth, updateUser, setLoading, restoreAuth } = authSlice.actions;
export default authSlice.reducer;
