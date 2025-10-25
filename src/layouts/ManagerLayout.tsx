import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/contexts/AuthContext";

interface ManagerLayoutProps {
  children: React.ReactNode;
}

const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigation = [
    {
      name: "Quản lý dịch vụ",
      href: "/manager/services",
      icon: WrenchScrewdriverIcon,
      current: location.pathname === "/manager/services",
    },
    {
      name: "Quản lý phòng khám",
      href: "/manager/rooms",
      icon: BuildingOfficeIcon,
      current: location.pathname === "/manager/rooms",
    },
    {
      name: "Quản lý lịch làm việc",
      href: "/manager/schedules",
      icon: CalendarDaysIcon,
      current: location.pathname === "/manager/schedules",
    },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          role="button"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Manager</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="mb-3 px-4">
            <p className="text-xs text-gray-500 mb-1">Đang đăng nhập</p>
            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.fullName || user?.email || "Manager"}
            </p>
          </div>
          <button
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            onClick={handleLogout}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Manager</span>
          </div>
          <div className="w-6" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default ManagerLayout;
