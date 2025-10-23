import React, { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AuthUser } from "@/api";
import type { RootState, AppDispatch } from "@/store/index";
import { setAuth, clearAuth, updateUser, setLoading, restoreAuth } from "@/store/slices/authSlice";

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
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = () => {
      try {
        dispatch(setLoading(true));
        
        // Try to restore from sessionStorage
        const storedUser = sessionStorage.getItem('user');
        const storedToken = sessionStorage.getItem('authToken');

        console.log('🔍 [AuthContext] Restoring from sessionStorage:', storedUser);

        if (storedUser && storedToken && isMounted) {
          const parsedUser = JSON.parse(storedUser) as AuthUser;
          console.log('🔍 [AuthContext] Parsed user emergencyContact:', (parsedUser as any).emergencyContact);
          // Normalize user data: ensure _id is set
          const normalizedUser = {
            ...parsedUser,
            _id: parsedUser._id || parsedUser.id || '',
            id: parsedUser.id || parsedUser._id || '',
          };
          dispatch(restoreAuth({ user: normalizedUser, token: storedToken }));
        } else if (isMounted) {
          dispatch(restoreAuth({ user: null, token: null }));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          dispatch(restoreAuth({ user: null, token: null }));
        }
      } finally {
        if (isMounted) {
          dispatch(setLoading(false));
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const login = (userData: AuthUser, token: string) => {
    // Normalize user data: ensure _id is set from either id or _id
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id || '',
      id: userData.id || userData._id || '',
    };
    
    // Save to sessionStorage
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('user', JSON.stringify(normalizedUser));
    
    // Dispatch Redux action
    dispatch(setAuth({ user: normalizedUser, token }));
  };

  const logout = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    
    // Dispatch Redux action
    dispatch(clearAuth());
  };

  const updateUserInfo = (userData: AuthUser) => {
    // Normalize user data: ensure _id is set
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id || '',
      id: userData.id || userData._id || '',
    };
    
    console.log('🔍 [AuthContext] updateUserInfo called with emergencyContact:', (normalizedUser as any).emergencyContact);
    
    // Update sessionStorage
    sessionStorage.setItem('user', JSON.stringify(normalizedUser));
    console.log('🔍 [AuthContext] Saved to sessionStorage:', sessionStorage.getItem('user'));
    
    // Dispatch Redux action
    dispatch(updateUser(normalizedUser));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser: updateUserInfo,
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
