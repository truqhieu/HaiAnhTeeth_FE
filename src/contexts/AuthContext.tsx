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
  const [isInitialized, setIsInitialized] = useState<boolean>(false); // 🚀 Track initialization




  // Debug Redux state
  console.log("🔍 [AuthContext] Redux state:", {
    user: user ? { id: user._id, role: user.role, email: user.email, fullName: user.fullName } : null,
    isAuthenticated,
    isLoading,
  });




  const navigate = useNavigate();
  const location = useLocation();


  // ⭐ STEP 4: Init auth bằng cách hỏi BE xem cookie còn không
  useEffect(() => {
    let isMounted = true;




    const initializeAuth = async () => {
      try {
        dispatch(setLoading(true));
        console.log("🔍 [AuthContext] Bootstrap auth via /auth/profile");




        // Gọi BE, browser sẽ tự gửi cookie nhờ credentials: "include"
        const res = await authApi.getProfile();




        if (!isMounted) return;




        if (res.success && res.data?.user) {
          const normalizedUser = normalizeUserData(res.data.user as AuthUser);




          // Lưu user vào sessionStorage cho FE tiện dùng (menu, header, v.v.)
          sessionStorage.setItem("user", JSON.stringify(normalizedUser));




          console.log("🔍 [AuthContext] Profile OK, setAuth with user:", {
            id: normalizedUser._id,
            role: normalizedUser.role,
            email: normalizedUser.email,
          });




          // Token ở Redux chỉ là info phụ, không dùng để auth nữa
          dispatch(setAuth({ user: normalizedUser, token: "" }));


          // 🚀 AUTO REDIRECT logic
          const role = normalizedUser.role?.toLowerCase();
          const currentPath = location.pathname;


          // Nếu không phải patient và đang ở trang public (home hoặc login), thì redirect
          if (role && role !== "patient") {
            const isPublicPage = currentPath === "/" || currentPath === "/login";


            if (isPublicPage) {
              console.log(`🔍 [AuthContext] Auto redirecting ${role} to dashboard`);
              if (role === "admin") navigate("/admin/accounts");
              else if (role === "manager") navigate("/manager/dashboard");
              else if (role === "staff") navigate("/staff/dashboard");
              else if (role === "doctor") navigate("/doctor/schedule");
              else if (role === "nurse") navigate("/nurse/schedule");
            }
          }


        } else {
          console.log("🔍 [AuthContext] No valid profile, clearAuth");
          sessionStorage.removeItem("user");
          dispatch(clearAuth());
          
          // 🔐 ONLY redirect if on a protected page (requires auth)
          const protectedPaths = ["/patient/", "/admin/", "/manager/", "/staff/", "/doctor/", "/nurse/"];
          const publicPages = [
            "/login", 
            "/signup", 
            "/forgot-password", 
            "/reset-password", 
            "/verify-email",
            "/about",
            "/services",
            "/news",
            "/promotions",
            "/unauthorized"
          ];
          const isProtectedPage = protectedPaths.some(path => location.pathname.startsWith(path));
          const isPublicPage = publicPages.some(page => location.pathname.startsWith(page));
          
          // Nếu đang ở trang home hoặc trang public, không redirect
          if (location.pathname === "/" || isPublicPage) {
            // Không làm gì, để user ở trang hiện tại
            return;
          }
          
          if (isProtectedPage) {
            console.log("🔍 [AuthContext] On protected page without auth, redirecting to unauthorized");
            navigate("/unauthorized");
          } else {
            console.log("🔍 [AuthContext] Not on public page, redirecting to home");
            navigate("/");
          }
        }
      } catch (error: any) {
        // ⭐ Don't log 401 errors as errors - they're expected when not authenticated
        const isUnauthorizedError = error?.message?.includes("Không có token xác thực") || 
                                   error?.message?.includes("401") ||
                                   error?.message?.includes("Unauthorized");
        
        if (isUnauthorizedError) {
          console.log("🔍 [AuthContext] Not authenticated (expected after logout or no session)");
        } else {
          console.error("❌ [AuthContext] Error initializing auth via profile:", error);
        }
        
        sessionStorage.removeItem("user");
        if (isMounted) {
          dispatch(clearAuth());
          
          // 🔐 ONLY redirect if on a protected page (requires auth)
          const protectedPaths = ["/patient/", "/admin/", "/manager/", "/staff/", "/doctor/", "/nurse/"];
          const publicPages = [
            "/login", 
            "/signup", 
            "/forgot-password", 
            "/reset-password", 
            "/verify-email",
            "/about",
            "/services",
            "/news",
            "/promotions",
            "/unauthorized"
          ];
          const isProtectedPage = protectedPaths.some(path => location.pathname.startsWith(path));
          const isPublicPage = publicPages.some(page => location.pathname.startsWith(page));
          
          // Nếu đang ở trang home hoặc trang public, không redirect
          if (location.pathname === "/" || isPublicPage) {
            // Không làm gì, để user ở trang hiện tại
            return;
          }
          
          if (isProtectedPage) {
            console.log("🔍 [AuthContext] On protected page without auth, redirecting to unauthorized");
            navigate("/unauthorized");
          } else {
            console.log("🔍 [AuthContext] Not on public page, redirecting to home");
            navigate("/");
          }
        }
      } finally {
        if (isMounted) {
          dispatch(setLoading(false));
          setIsInitialized(true); // 🚀 Mark as initialized
        }
      }
    };




    // ⭐ Chỉ chạy một lần khi component mount, không chạy lại khi pathname thay đổi
    // Điều này tránh gọi /auth/profile không cần thiết khi navigate đến /login
    if (!isInitialized) {
      initializeAuth();
    }




    return () => {
      isMounted = false;
    };
  }, [dispatch, navigate, isInitialized]); // ⭐ Loại bỏ location.pathname khỏi dependencies




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


  // 🚀 Show loading screen until initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <Spinner size="lg" label="Đang tải..." color="primary" />
      </div>
    );
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};




export const useAuth = () => {
  const context = useContext(AuthContext);




  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }




  return context;
};









