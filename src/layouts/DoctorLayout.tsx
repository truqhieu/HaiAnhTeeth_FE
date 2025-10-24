import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import {
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/contexts/AuthContext";

const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link className="flex items-center space-x-3" to="/doctor/schedule">
              <img
                alt="Logo"
                className="h-10 w-auto object-contain"
                src="/logo2.png"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Bác sĩ - {user?.fullName || "Doctor"}
                </h1>
                <p className="text-xs text-gray-500">Quản lý lịch khám</p>
              </div>
            </Link>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <UserCircleIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">
                  {user?.fullName || "Doctor"}
                </span>
              </div>
              <Button
                color="danger"
                size="sm"
                startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                variant="flat"
                onPress={handleLogout}
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600"
                  to="/doctor/schedule"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span className="font-medium">Lịch khám</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default DoctorLayout;
