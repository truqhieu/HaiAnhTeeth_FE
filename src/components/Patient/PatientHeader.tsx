import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  PhoneIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Navbar,
  NavbarContent,
  NavbarItem,
  Link,
  Input,
} from "@heroui/react";
import Lottie from "lottie-react";
import searchAnimation from "../../icons/search.json";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/Common/NotificationBell";

const PatientHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full shadow bg-white text-base md:text-lg">
      {/* Top bar - Left side flush to left edge, Right side flush to right edge */}
      <div className="bg-[#39BDCC] text-white text-base md:text-lg font-semibold tracking-wide relative py-10">
        {/* Left-most: flush to left edge */}
        <div className="absolute left-0 inset-y-0 flex items-center pl-8">
          <a
            className="flex items-center space-x-2 hover:text-gray-100"
            href="tel:02473008866"
          >
            <PhoneIcon className="w-5 h-5" />
            <span>Hỗ trợ tư vấn: 024 7300 8866</span>
          </a>
        </div>

        {/* Right-most: flush to right edge */}
        <div className="absolute right-0 inset-y-0 flex items-center space-x-5 pr-10">
          <a
            className="bg-[#39BDCC] hover:bg-green-500 px-4 py-1.5 rounded text-white font-semibold text-base md:text-lg"
            href="/offers"
          >
            Ưu đãi nổi bật
          </a>

          <select
            className="bg-transparent text-white uppercase font-semibold text-base md:text-lg focus:outline-none cursor-pointer"
            name="language"
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
            <option value="kr">KR</option>
            <option value="cn">CN</option>
          </select>

          {/* Chat icon */}
          <div className="relative">
            <Button
              isIconOnly
              className="text-white hover:text-gray-200 min-w-unit-0 p-3"
              variant="light"
              size="lg"
              onClick={() => navigate("/patient/chat")}
            >
              <ChatBubbleLeftRightIcon className="w-10 h-10" />
            </Button>
            {/* Mock unread chat count - replace with real data */}
            {3 > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#39BDCC]"></span>
            )}
          </div>

          {/* Notification bell with dropdown */}
          <div className="relative">
            <NotificationBell iconClassName="w-10 h-10 text-white" />
          </div>

          {/* User name */}
          <span className="text-white font-semibold">
            {user?.fullName || "Patient"}
          </span>

          {/* User profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              isIconOnly
              className="text-white hover:text-gray-200 min-w-unit-0 p-3"
              variant="light"
              size="lg"
              onClick={() => setIsDropdownOpen((s) => !s)}
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center cursor-pointer">
                <UserCircleIcon className="w-10 h-10 text-white" />
              </div>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName || "Patient"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  {[
                    {
                      label: "Ca khám của tôi",
                      icon: CalendarDaysIcon,
                      path: "/patient/appointments",
                    },
                    {
                      label: "Hồ sơ khám bệnh",
                      icon: DocumentTextIcon,
                      path: "/patient/medical-records",
                    },
                    {
                      label: "Khiếu nại",
                      icon: ExclamationTriangleIcon,
                      path: "/patient/complaints",
                    },
                    {
                      label: "Hồ sơ cá nhân",
                      icon: UserCircleIcon,
                      path: "/patient/account-settings",
                    },
                  ].map((item) => (
                    <button
                      key={item.path}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#E0F7FA] hover:text-gray-900 hover:font-semibold flex items-center cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        navigate(item.path);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </button>
                  ))}

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 hover:font-semibold flex items-center cursor-pointer transition-colors duration-200"
                    onClick={() => {
                      logout();
                      navigate("/");
                      setIsDropdownOpen(false);
                    }}
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center placeholder to preserve vertical height (không thay đổi nội dung) */}
        <div className="max-w-7xl mx-auto px-6 pointer-events-none" style={{ height: 0 }} />
      </div>

      {/* Main Navbar - Đồng bộ layout với AppNavbar */}
      <div className="flex items-center h-28 px-8">
        {/* Logo bên trái */}
        <div className="flex-shrink-0 mr-10 lg:mr-0">
          <Link className="flex items-center" href="/">
            <img alt="Logo" className="h-20 w-auto object-contain" src="/logo1.png" />
            <img alt="Logo Text" className="h-14 w-auto object-contain ml-3" src="/logo2.png" />
          </Link>
        </div>

        {/* Navbar Items */}
        <Navbar className="flex-1">
          <NavbarContent className="hidden sm:flex gap-6 lg:gap-8 -ml-8 lg:-ml-12" justify="center">
            {[
              { label: "Giới thiệu", href: "/about" },
              { label: "Dịch vụ", href: "/services" },
              { label: "Danh sách bác sĩ", href: "/doctors" },
              { label: "Chuyên khoa", href: "/departments" },
              { label: "Tin tức & Ưu đãi", href: "/news" },
              { label: "Liên hệ", href: "/contact" },
            ].map((item) => (
              <NavbarItem key={item.href}>
                <Link
                  color="foreground"
                  href={item.href}
                  className="font-semibold text-gray-800 hover:text-[#39BDCC] transition-colors text-lg md:text-xl"
                >
                  {item.label}
                </Link>
              </NavbarItem>
            ))}
          </NavbarContent>

          {/* Search bên phải */}
          <NavbarContent justify="end" className="flex items-center gap-3">
            <NavbarItem className="flex items-center gap-3">
              <button
                className="w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Lottie animationData={searchAnimation} autoplay={false} loop={false} style={{ width: 32, height: 32 }} />
              </button>

              <div className={`transition-all duration-300 overflow-hidden ${showSearch ? "w-44 lg:w-52 opacity-100" : "w-0 opacity-0"}`}>
                <Input className="w-full text-base md:text-lg" placeholder="Tìm kiếm..." size="md" />
              </div>

              <Button className="bg-[#39BDCC] text-white font-semibold text-base md:text-lg hover:bg-[#2ca6b5] ml-2 px-4 py-2" size="md">
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
