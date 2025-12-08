import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import Unauthorized from "@/components/Common/Unauthorized";

interface StaffLayoutProps {
  children: React.ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // ⭐ AUTHORIZATION: Check if user is Staff or Manager
  if (!user || (user.role?.toLowerCase() !== 'staff')) {
    return <Unauthorized />;
  }

  const handleLogout = () => {
    // Redirect về home trước khi logout để tránh redirect đến unauthorized
    navigate("/");
    logout();
  };

  const profilePath = "/staff/profile";

  const navigation = [
    {
      name: "Quản lý ca khám",
      href: "/staff/dashboard",
      icon: HomeIcon,
      current: location.pathname === "/staff/dashboard",
    },
    {
      name: "Đơn xin nghỉ phép",
      href: "/staff/leave-requests",
      icon: DocumentTextIcon,
      current: location.pathname === "/staff/leave-requests",
    },
    {
      name: "Xử lý yêu cầu",
      href: "/staff/patient-requests",
      icon: ClipboardDocumentListIcon,
      current: location.pathname === "/staff/patient-requests",
    },
    {
      name: "Thông báo",
      href: "/staff/notifications",
      icon: BellIcon,
      current: location.pathname === "/staff/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
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
        <div className="flex items-center h-16 px-3 sm:px-4 md:px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center w-full space-x-2 sm:space-x-3">
            <Avatar
              className="w-8 h-8 sm:w-10 sm:h-10 border border-blue-100 flex-shrink-0"
              name={user?.fullName || "Staff"}
              src={user?.avatar}
            />
            <div className="hidden sm:block min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Lễ tân</p>
              <span className="text-sm sm:text-lg font-semibold text-gray-800 truncate block">
                {user?.fullName || "Chưa xác định"}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-2 sm:px-3 md:px-4 py-4 sm:py-6 overflow-y-auto min-h-0">
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
                  <div className="relative flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                    {(item as any).badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <span className="hidden sm:inline ml-2 sm:ml-3 truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Profile & Logout Section - Fixed at bottom */}
        <div className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-t border-gray-200 space-y-1 sm:space-y-2 flex-shrink-0 bg-white">
          <button
            className="w-full flex items-center justify-center sm:justify-start px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            onClick={() => handleNavigation(profilePath)}
            title="Hồ sơ cá nhân"
          >
            <UserCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline ml-2 sm:ml-3">Hồ sơ cá nhân</span>
          </button>
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

export default StaffLayout;
