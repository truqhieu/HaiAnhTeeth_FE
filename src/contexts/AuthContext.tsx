import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, AuthUser } from "@/api";

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
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = () => {
      try {
        const currentUser = authApi.getCurrentUser();
        const token = authApi.getToken();

        if (currentUser && token) {
          // SỬA LỖI: Ép kiểu currentUser thành AuthUser để khớp với state
          if (isMounted) {
            setUser(currentUser as AuthUser);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        authApi.logout();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData: AuthUser, token: string) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateUser = (userData: AuthUser) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
