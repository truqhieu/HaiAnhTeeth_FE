import type { AuthUser } from "@/api";
import type { RootState, AppDispatch } from "@/store/index";



import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spinner } from "@heroui/react";
import { useDispatch, useSelector } from "react-redux";


import {
  setAuth,
  clearAuth,
  updateUser,
  setLoading,
} from "@/store/slices/authSlice";


import { authApi } from "@/api/auth";


// Chuẩn hoá user
const normalizeUserData = (userData: AuthUser): AuthUser => {
  const normalizedRole = userData.role ? userData.role.toLowerCase() : userData.role;


  const normalizedUser = {
    ...userData,
    _id: userData._id || userData.id || "",
    id: userData.id || userData._id || "",
    role: normalizedRole,
  };


  const phoneValue =
    (normalizedUser as AuthUser).phone ??
    (normalizedUser as AuthUser).phoneNumber ??
    "";


  return {
    ...(normalizedUser as AuthUser),
    phone: phoneValue || undefined,
    phoneNumber:
      (normalizedUser as AuthUser).phoneNumber ?? phoneValue ?? undefined,
  };
};


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

  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    let isMounted = true;


    const initializeAuth = async () => {
      try {
        dispatch(setLoading(true));

        // Try to restore from sessionStorage
        const storedUser = sessionStorage.getItem("user");
        const storedToken = sessionStorage.getItem("authToken");

        console.log(
          "🔍 [AuthContext] Restoring from sessionStorage:",
          storedUser,
        );

        if (storedUser && storedToken && isMounted) {
          const parsedUser = JSON.parse(storedUser) as AuthUser;

          console.log(
            "🔍 [AuthContext] Parsed user emergencyContact:",
            (parsedUser as any).emergencyContact,
          );
          // Normalize user data: ensure _id is set
          const normalizedUser = normalizeUserData(parsedUser as AuthUser);

          console.log("🔍 [AuthContext] Restoring auth with user:", normalizedUser);
          console.log("🔍 [AuthContext] Restoring auth with token:", storedToken);
          
          // Use setAuth instead of restoreAuth to ensure proper state update
          dispatch(setAuth({ user: normalizedUser, token: storedToken }));
          
          console.log("🔍 [AuthContext] Dispatched setAuth for restore");
        } else if (isMounted) {
          console.log("🔍 [AuthContext] No stored auth found, clearing state");
          dispatch(clearAuth());
          navigate("/"); // 🚀 Redirect to homepage when session invalid
        }
      } catch (error) {
        console.error("❌ [AuthContext] Error initializing auth via profile:", error);
        sessionStorage.removeItem("user");
        if (isMounted) {
          dispatch(clearAuth());
          navigate("/"); // 🚀 Redirect to homepage when session expired
        }
      } finally {
        if (isMounted) {
          dispatch(setLoading(false));
          setIsInitialized(true); // 🚀 Mark as initialized
        }
      }
    };


    initializeAuth();


    return () => {
      isMounted = false;
    };
  }, [dispatch]);


  const login = (userData: AuthUser, token: string) => {
    const normalizedUser = normalizeUserData(userData);


    console.log("🔍 [AuthContext] Login called with user:", normalizedUser);


    // ⭐ KHÔNG lưu authToken nữa – chỉ lưu user
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));


    console.log("🔍 [AuthContext] Saved to sessionStorage:", {
      user: !!sessionStorage.getItem("user"),
    });


    // Redux vẫn giữ token nếu bạn cần dùng cho logic khác (nhưng không dùng cho auth nữa)
    dispatch(setAuth({ user: normalizedUser, token }));


    console.log("🔍 [AuthContext] Dispatched setAuth action");
  };


  const logout = () => {
    console.log("🔍 [AuthContext] Logout called");


    // Gọi BE để clear cookie (không chờ cũng được)
    authApi
      .logout()
      .catch((err) => console.warn("⚠️ [AuthContext] Logout API error:", err));


    // Clear sessionStorage
    sessionStorage.removeItem("user");


    console.log("🔍 [AuthContext] Cleared sessionStorage");


    // Redux clear
    dispatch(clearAuth());


    console.log("🔍 [AuthContext] Dispatched clearAuth");
  };


  const updateUserInfo = (userData: AuthUser) => {
    const normalizedUser = normalizeUserData(userData);


    console.log(
      "🔍 [AuthContext] updateUserInfo called with emergencyContact:",
      (normalizedUser as any).emergencyContact,
    );


    // Update sessionStorage
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));
    console.log(
      "🔍 [AuthContext] Saved to sessionStorage:",
      sessionStorage.getItem("user"),
    );


    // Update Redux
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
    hasUser: !!sessionStorage.getItem("user"),
  });


  // Debug sessionStorage content
  const sessionUser = sessionStorage.getItem("user");
  console.log("🔍 [AuthContext] SessionStorage content:", {
    hasUser: !!sessionUser,
    userData: sessionUser ? JSON.parse(sessionUser) : null,
  });

  // Force re-render when sessionStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = sessionStorage.getItem("user");
      const storedToken = sessionStorage.getItem("authToken");
      
      if (storedUser && storedToken && !user) {
        console.log("🔍 [AuthContext] Storage changed, restoring auth");
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        const normalizedUser = normalizeUserData(parsedUser as AuthUser);
        dispatch(setAuth({ user: normalizedUser, token: storedToken }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch, user]);

  // Additional effect to check and restore auth immediately
  React.useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const storedToken = sessionStorage.getItem("authToken");
    
    if (storedUser && storedToken && !user) {
      console.log("🔍 [AuthContext] Found stored auth but no user in state, restoring immediately");
      const parsedUser = JSON.parse(storedUser) as AuthUser;
      const normalizedUser = normalizeUserData(parsedUser as AuthUser);
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



