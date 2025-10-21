import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  ChevronDownIcon,
  HomeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Navbar,
  NavbarContent,
  NavbarItem,
  Link,
  Input,
} from "@heroui/react";
import Lottie from "lottie-react";

import searchAnimation from "../../icons/search.json";

import { useAuth } from "@/contexts/AuthContext";
import { useBookingModal } from "@/contexts/BookingModalContext";

const PatientHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const { openBookingModal } = useBookingModal();

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

  return (
    <header className="w-full shadow bg-white">
      {/* Top bar - Giữ nguyên từ PatientHeader */}
      <div className="bg-[#39BDCC] text-white">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-3">
          {/* Left side - User info placeholder hoặc logo nhỏ nếu cần */}
          <div className="flex items-center">
            {/* Có thể để trống hoặc thêm thông tin */}
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
            <span className="text-white font-medium">
              {user?.fullName || "Patient"}
            </span>

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
              <DropdownMenu aria-label="User menu" className="w-56">
                <DropdownItem
                  key="dashboard-header"
                  className="font-semibold text-gray-800 bg-gray-100 whitespace-nowrap"
                  onPress={() => {
                    setIsDashboardExpanded(!isDashboardExpanded);
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
                        isDashboardExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </DropdownItem>

                <DropdownItem
                  key="appointments"
                  onPress={() => navigate("/patient/appointments")}
                  className={isDashboardExpanded ? "" : "hidden"}
                >
                  <div className="flex items-center space-x-3 pl-8 whitespace-nowrap">
                    <span>Ca khám của tôi</span>
                  </div>
                </DropdownItem>
                
                <DropdownItem
                  key="medical-records"
                  onPress={() => navigate("/patient/medical-records")}
                  className={isDashboardExpanded ? "" : "hidden"}
                >
                  <div className="flex items-center space-x-3 pl-8 whitespace-nowrap">
                    <span>Hồ sơ khám bệnh</span>
                  </div>
                </DropdownItem>
                
                <DropdownItem
                  key="complaints"
                  onPress={() => navigate("/patient/complaints")}
                  className={isDashboardExpanded ? "" : "hidden"}
                >
                  <div className="flex items-center space-x-3 pl-8 whitespace-nowrap">
                    <span>Khiếu nại</span>
                  </div>
                </DropdownItem>

                <DropdownItem
                  key="settings-item"
                  onPress={() => navigate("/patient/account-settings")}
                >
                  <div className="flex items-center space-x-3 whitespace-nowrap">
                    <Cog6ToothIcon className="w-4 h-4" />
                    <span>Cài đặt</span>
                  </div>
                </DropdownItem>

                <DropdownItem
                  key="logout-item"
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

      {/* Main Navbar - Giống y hệt AppNavbar */}
      <div className="flex items-center h-30 px-4">
        {/* Logo bên trái */}
        <div className="flex-shrink-0">
          <Link className="flex items-center" href="/">
            <img
              alt="Logo"
              className="h-20 w-auto object-contain"
              src="/logo1.png"
            />
            <img
              alt="Logo Text"
              className="h-12 w-auto object-contain ml-2"
              src="/logo2.png"
            />
          </Link>
        </div>

        {/* Navbar Items + Search */}
        <Navbar className="flex-1">
          {/* Menu Items ở giữa */}
          <NavbarContent className="hidden sm:flex gap-6" justify="center">
            <NavbarItem>
              <Link color="foreground" href="/about">
                Giới thiệu
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="/services">
                Dịch vụ
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="/doctors">
                Danh sách bác sĩ
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="/departments">
                Chuyên khoa
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="/news">
                Tin tức & Ưu đãi
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="/contact">
                Liên hệ
              </Link>
            </NavbarItem>
          </NavbarContent>

          {/* Search */}
          <NavbarContent justify="end">
            <NavbarItem className="flex items-center gap-2">
              <button
                className="w-10 h-10 flex items-center justify-center"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Lottie
                  animationData={searchAnimation}
                  autoplay={false}
                  loop={false}
                  style={{ width: 32, height: 32 }}
                />
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  showSearch ? "w-48 opacity-100" : "w-0 opacity-0"
                }`}
              >
                <Input className="w-full" placeholder="Tìm kiếm..." size="sm" />
              </div>
              <Button
                className="bg-[#39BDCC] text-white hover:bg-[#2ca6b5] ml-2"
                size="sm"
                onPress={openBookingModal}
              >
                Để lại thông tin tư vấn
              </Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      </div>
    </header>
  );
};

export default PatientHeader;