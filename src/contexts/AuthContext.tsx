import type { AuthUser } from "@/api";
import type { RootState, AppDispatch } from "@/store/index";

import React, { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setAuth,
  clearAuth,
  updateUser,
  setLoading,
  restoreAuth,
} from "@/store/slices/authSlice";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  // Debug Redux state
  console.log("🔍 [AuthContext] Redux state:", {
    user: user ? { id: user._id, role: user.role, email: user.email, fullName: user.fullName } : null,
    isAuthenticated,
    isLoading,
  });

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = () => {
      try {
        dispatch(setLoading(true));

        // Try to restore from localStorage
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("authToken");
        const storedTimestamp = localStorage.getItem("authTimestamp");

        console.log(
          "🔍 [AuthContext] Restoring from localStorage:",
          storedUser,
        );

        // Check if token is expired (24 hours = 86400000 ms)
        const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
        const isExpired = storedTimestamp 
          ? (Date.now() - parseInt(storedTimestamp)) > TOKEN_EXPIRY_MS
          : false;

        if (isExpired) {
          console.log("🔍 [AuthContext] Token expired, clearing auth");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          localStorage.removeItem("authTimestamp");
          if (isMounted) {
            dispatch(clearAuth());
          }
          return;
        }

        if (storedUser && storedToken && isMounted) {
          const parsedUser = JSON.parse(storedUser) as AuthUser;

          console.log(
            "🔍 [AuthContext] Parsed user emergencyContact:",
            (parsedUser as any).emergencyContact,
          );
          // Normalize user data: ensure _id is set
          const normalizedUser = {
            ...parsedUser,
            _id: parsedUser._id || parsedUser.id || "",
            id: parsedUser.id || parsedUser._id || "",
            role: parsedUser.role?.toLowerCase(),
          };

          console.log("🔍 [AuthContext] Restoring auth with user:", normalizedUser);
          console.log("🔍 [AuthContext] Restoring auth with token:", storedToken);
          
          // Use setAuth instead of restoreAuth to ensure proper state update
          dispatch(setAuth({ user: normalizedUser, token: storedToken }));
          
          console.log("🔍 [AuthContext] Dispatched setAuth for restore");
        } else if (isMounted) {
          console.log("🔍 [AuthContext] No stored auth found, clearing state");
          dispatch(clearAuth());
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          dispatch(clearAuth());
        }
      } finally {
        if (isMounted) {
          dispatch(setLoading(false));
        }
      }
    };

    // Only initialize if we don't have user data yet
    if (!user) {
      initializeAuth();
    } else {
      dispatch(setLoading(false));
    }

    return () => {
      isMounted = false;
    };
  }, [dispatch, user]);

  const login = (userData: AuthUser, token: string) => {
    // Normalize user data: ensure _id is set from either id or _id
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id || "",
      id: userData.id || userData._id || "",
      role: userData.role?.toLowerCase(),
    };

    console.log("🔍 [AuthContext] Login called with user:", normalizedUser);

    // Save to localStorage with timestamp (24h expiry)
    const timestamp = Date.now().toString();
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("authTimestamp", timestamp);

    console.log("🔍 [AuthContext] Saved to localStorage:", {
      token: !!localStorage.getItem("authToken"),
      user: !!localStorage.getItem("user"),
      timestamp: localStorage.getItem("authTimestamp"),
    });

    // Dispatch Redux action
    dispatch(setAuth({ user: normalizedUser, token }));
    
    console.log("🔍 [AuthContext] Dispatched setAuth action");
  };

  const logout = () => {
    console.log("🔍 [AuthContext] Logout called");
    
    // Clear localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("authTimestamp");

    console.log("🔍 [AuthContext] Cleared localStorage");

    // Dispatch Redux action
    dispatch(clearAuth());
    
    console.log("🔍 [AuthContext] Dispatched clearAuth");
  };

  const updateUserInfo = (userData: AuthUser) => {
    // Normalize user data: ensure _id is set
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id || "",
      id: userData.id || userData._id || "",
      role: userData.role?.toLowerCase(),
    };

    console.log(
      "🔍 [AuthContext] updateUserInfo called with emergencyContact:",
      (normalizedUser as any).emergencyContact,
    );

    // Update localStorage
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    console.log(
      "🔍 [AuthContext] Saved to localStorage:",
      localStorage.getItem("user"),
    );

    // Dispatch Redux action
    dispatch(updateUser(normalizedUser));
    
    console.log("🔍 [AuthContext] Dispatched updateUser");
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser: updateUserInfo,
  };

  // Debug logs
  console.log("🔍 [AuthContext] Current state:", {
    user: user ? { id: user._id, role: user.role, email: user.email, fullName: user.fullName } : null,
    isAuthenticated,
    isLoading,
    hasToken: !!localStorage.getItem("authToken"),
    hasUser: !!localStorage.getItem("user"),
  });

  // Debug localStorage content
  const localUser = localStorage.getItem("user");
  const localToken = localStorage.getItem("authToken");
  console.log("🔍 [AuthContext] LocalStorage content:", {
    hasToken: !!localToken,
    hasUser: !!localUser,
    userData: localUser ? JSON.parse(localUser) : null,
  });

  // Force re-render when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("authToken");
      const storedTimestamp = localStorage.getItem("authTimestamp");
      
      // Check if token is expired
      const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
      const isExpired = storedTimestamp 
        ? (Date.now() - parseInt(storedTimestamp)) > TOKEN_EXPIRY_MS
        : false;

      if (isExpired) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("authTimestamp");
        dispatch(clearAuth());
        return;
      }
      
      if (storedUser && storedToken && !user) {
        console.log("🔍 [AuthContext] Storage changed, restoring auth");
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        const normalizedUser = {
          ...parsedUser,
          _id: parsedUser._id || parsedUser.id || "",
          id: parsedUser.id || parsedUser._id || "",
          role: parsedUser.role?.toLowerCase(),
        };
        dispatch(setAuth({ user: normalizedUser, token: storedToken }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch, user]);

  // Additional effect to check and restore auth immediately
  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");
    const storedTimestamp = localStorage.getItem("authTimestamp");
    
    // Check if token is expired
    const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    const isExpired = storedTimestamp 
      ? (Date.now() - parseInt(storedTimestamp)) > TOKEN_EXPIRY_MS
      : false;

    if (isExpired) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("authTimestamp");
      dispatch(clearAuth());
      return;
    }
    
    if (storedUser && storedToken && !user) {
      console.log("🔍 [AuthContext] Found stored auth but no user in state, restoring immediately");
      const parsedUser = JSON.parse(storedUser) as AuthUser;
      const normalizedUser = {
        ...parsedUser,
        _id: parsedUser._id || parsedUser.id || "",
        id: parsedUser.id || parsedUser._id || "",
        role: parsedUser.role?.toLowerCase(),
      };
      dispatch(setAuth({ user: normalizedUser, token: storedToken }));
    }
  }, [dispatch, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
