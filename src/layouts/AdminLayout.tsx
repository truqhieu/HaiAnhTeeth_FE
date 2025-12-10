import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Check quyền truy cập
  useEffect(() => {
    if (isAuthenticated && user) {
      const normalizedRole = user.role?.toLowerCase();
      if (normalizedRole !== "admin") {
        navigate("/unauthorized");
      }
    } else if (!isAuthenticated && location.pathname.startsWith("/admin/")) {
      // Nếu không authenticated và đang ở trang admin, redirect về home
      navigate("/");
    }
  }, [user, isAuthenticated, navigate, location.pathname]);

  const handleLogout = () => {
    // Redirect về home trước khi logout để tránh redirect đến unauthorized
    navigate("/");
    logout();
  };

  const navigation = [
    {
      name: "Quản lý tài khoản",
      href: "/admin/accounts",
      icon: HomeIcon,
      current:
        location.pathname === "/admin/accounts" ||
        location.pathname === "/admin" ||
        location.pathname === "/admin/",
    },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - luôn hiển thị */}
      <div className="w-16 sm:w-48 md:w-56 lg:w-64 bg-white shadow-lg lg:sticky lg:top-0 lg:h-screen flex flex-col flex-shrink-0 transition-all duration-300">
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-3 sm:px-4 md:px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex-shrink-0">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <span className="hidden sm:inline text-sm sm:text-lg font-semibold text-gray-800">Admin</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-2 sm:px-3 md:px-4 py-4 sm:py-6">
          <div className="space-y-1 sm:space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  className={`w-full flex items-center justify-center sm:justify-start px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => handleNavigation(item.href)}
                  title={item.name}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden sm:inline ml-2 sm:ml-3">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-t border-gray-200">
          <div className="mb-2 sm:mb-3 px-2 sm:px-4">
            <p className="hidden sm:block text-xs sm:text-sm font-medium text-gray-700 truncate">
              {user?.fullName || user?.email || "Admin"}
            </p>
          </div>
          <button
            className="w-full flex items-center justify-center sm:justify-start px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline ml-2 sm:ml-3">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
