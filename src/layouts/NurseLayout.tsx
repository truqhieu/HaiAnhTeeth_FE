import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  BellIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface NurseLayoutProps {
  children: React.ReactNode;
}

const NurseLayout: React.FC<NurseLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  // Check quyền truy cập
  useEffect(() => {
    if (isAuthenticated && user) {
      const normalizedRole = user.role?.toLowerCase();
      if (normalizedRole !== "nurse") {
        navigate("/unauthorized");
      }
    } else if (!isAuthenticated) {
      // AuthContext sẽ xử lý redirect
    }
  }, [user, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const profilePath = "/nurse/profile";

  const navigation = [
    {
      name: "Lịch khám",
      href: "/nurse/schedule",
      icon: CalendarIcon,
      current: location.pathname === "/nurse/schedule",
    },
    {
      name: "Đơn xin nghỉ phép",
      href: "/nurse/leave-requests",
      icon: DocumentTextIcon,
      current: location.pathname === "/nurse/leave-requests",
    },
    {
      name: "Thông báo",
      href: "/nurse/notifications",
      icon: BellIcon,
      current: location.pathname === "/nurse/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center w-full space-x-3">
            <Avatar
              className="w-10 h-10 border border-pink-100"
              name={user?.fullName || "Nurse"}
              src={user?.avatar}
            />
            <div>
              <p className="text-sm text-gray-500">Điều dưỡng</p>
              <span className="text-lg font-semibold text-gray-800">
                {user?.fullName || "Chưa xác định"}
              </span>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto min-h-0">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-pink-50 text-pink-700 border-r-2 border-pink-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="relative mr-3">
                    <Icon className="w-5 h-5" />
                    {(item as any).badge && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Profile & Logout Section - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-gray-200 space-y-2 flex-shrink-0 bg-white">
          <button
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            onClick={() => handleNavigation(profilePath)}
          >
            <UserCircleIcon className="w-5 h-5 mr-3 text-gray-600" />
            Hồ sơ cá nhân
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <Avatar
              className="w-10 h-10 border border-pink-100"
              name={user?.fullName || "Nurse"}
              src={user?.avatar}
            />
            <span className="text-lg font-semibold text-gray-800">
              {user?.fullName || "Điều dưỡng"}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default NurseLayout;
