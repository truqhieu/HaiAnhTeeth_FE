import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  ChevronDownIcon,
  HomeIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input } from "@heroui/react";

import { useAuth } from "@/contexts/AuthContext";

const PatientHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    {
      key: "appointments",
      label: "Ca khám của tôi",
      action: () => navigate("/patient/appointments"),
    },
    {
      key: "medical-records", 
      label: "Hồ sơ khám bệnh",
      action: () => navigate("/patient/medical-records"),
    },
    {
      key: "complaints",
      label: "Khiếu nại", 
      action: () => navigate("/patient/complaints"),
    },
    {
      key: "settings",
      label: "Cài đặt",
      icon: <Cog6ToothIcon className="w-4 h-4" />,
      action: () => navigate("/patient/account-settings"),
    },
  ];

  const navigationItems = [
    { label: "Giới thiệu", href: "/about", active: true },
    { label: "Dịch vụ", href: "/services", active: false },
    { label: "Danh sách bác sĩ", href: "/doctors", active: false },
    { label: "Chuyên khoa", href: "/departments", active: false },
    { label: "Tư vấn", href: "/consultation", active: false },
    { label: "Ưu đãi", href: "/offers", active: false },
  ];

  return (
    <header className="w-full">
      {/* Top Header */}
      <div className="bg-[#39BDCC] text-white">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-3">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/Screenshot_2025-09-19_141436-removebg-preview.png"
            />
          </div>

          {/* Right side - User info and dropdown */}
          <div className="flex items-center space-x-4">
            {/* Notification bell */}
            <Button
              isIconOnly
              className="text-white hover:text-gray-200"
              variant="light"
              size="sm"
            >
              <BellIcon className="w-5 h-5" />
            </Button>

            {/* User name */}
            <span className="text-white font-medium">{user?.fullName || "Patient"}</span>

            {/* User dropdown */}
            <Dropdown 
              isOpen={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
              placement="bottom-end"
            >
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="text-white hover:text-gray-200"
                  variant="light"
                  size="sm"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="User menu"
                className="w-56"
              >
                {/* Bảng điều khiển header - clickable */}
                <DropdownItem
                  key="dashboard-header"
                  className="font-semibold text-gray-800 bg-gray-100 whitespace-nowrap"
                  onPress={() => {
                    setIsDashboardExpanded(!isDashboardExpanded);
                    // Prevent dropdown from closing
                    setTimeout(() => {
                      setIsDropdownOpen(true);
                    }, 0);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <HomeIcon className="w-4 h-4" />
                      <span>Bảng điều khiển</span>
                    </div>
                    <ChevronDownIcon 
                      className={`w-4 h-4 transition-transform ${
                        isDashboardExpanded ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </DropdownItem>
                
                {/* Menu items - conditional render */}
                {isDashboardExpanded ? menuItems.slice(0, 3).map((item) => (
                  <DropdownItem
                    key={item.key}
                    onPress={item.action}
                  >
                    <div className="flex items-center space-x-3 pl-8 whitespace-nowrap">
                      {item.icon && <span>{item.icon}</span>}
                      <span>{item.label}</span>
                    </div>
                  </DropdownItem>
                )) : null}
                
                {/* Settings */}
                <DropdownItem
                  key="settings"
                  onPress={() => navigate("/patient/account-settings")}
                >
                  <div className="flex items-center space-x-3 whitespace-nowrap">
                    <Cog6ToothIcon className="w-4 h-4" />
                    <span>Cài đặt</span>
                  </div>
                </DropdownItem>
                
                <DropdownItem
                  key="logout"
                  className="text-red-600"
                  onPress={handleLogout}
                >
                  Đăng xuất
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-3">
          {/* Navigation Items */}
          <nav className="flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                className={`text-sm font-medium transition-colors ${
                  item.active
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => navigate(item.href)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="flex items-center">
            <div className="relative">
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="w-64"
                size="sm"
                startContent={
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                }
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;
