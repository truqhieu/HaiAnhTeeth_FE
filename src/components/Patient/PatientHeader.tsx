import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  UserCircleIcon,
  PhoneIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
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
import { useBookingModal } from "@/contexts/BookingModalContext";

const PatientHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const { openBookingModal } = useBookingModal();

  return (
    <header className="w-full shadow bg-white text-base md:text-lg">
      {/* Top bar - Đồng bộ với AppNavbar */}
      <div className="bg-[#39BDCC] text-white text-base md:text-lg font-semibold tracking-wide">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center py-3">
          {/* Left side - Phone support */}
          <div className="flex items-center space-x-6">
            <a
              className="flex items-center space-x-2 hover:text-gray-100"
              href="tel:02473008866"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>Hỗ trợ tư vấn: 024 7300 8866</span>
            </a>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-5">
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

            {/* Notification bell */}
            <Button
              isIconOnly
              className="text-white hover:text-gray-200 min-w-unit-0 p-3"
              variant="light"
              size="lg"
            >
              <BellIcon className="w-10 h-10" />
            </Button>

            {/* User name */}
            <span className="text-white font-semibold">
              {user?.fullName || "Patient"}
            </span>

            {/* User profile dropdown */}
            <div className="relative group">
              <Button
                isIconOnly
                className="text-white hover:text-gray-200 min-w-unit-0 p-3"
                variant="light"
                size="lg"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-5 h-5 text-white" />
                </div>
              </Button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName || "Patient"}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    onClick={() => navigate("/patient/appointments")}
                  >
                    <CalendarDaysIcon className="w-4 h-4 mr-3" />
                    Ca khám của tôi
                  </button>
                  
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    onClick={() => navigate("/patient/medical-records")}
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-3" />
                    Hồ sơ khám bệnh
                  </button>
                  
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    onClick={() => navigate("/patient/complaints")}
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-3" />
                    Khiếu nại
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    onClick={() => navigate("/patient/account-settings")}
                  >
                    <UserCircleIcon className="w-4 h-4 mr-3" />
                    Hồ sơ cá nhân
                  </button>
                  
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Navbar - Đồng bộ layout với AppNavbar */}
      <div className="flex items-center h-28 px-8">
        {/* Logo bên trái */}
        <div className="flex-shrink-0 mr-10 lg:mr-0">
          <Link className="flex items-center" href="/">
            <img
              alt="Logo"
              className="h-20 w-auto object-contain"
              src="/logo1.png"
            />
            <img
              alt="Logo Text"
              className="h-14 w-auto object-contain ml-3"
              src="/logo2.png"
            />
          </Link>
        </div>

        {/* Navbar Items */}
        <Navbar className="flex-1">
          <NavbarContent
            className="hidden sm:flex gap-6 lg:gap-8 -ml-8 lg:-ml-12"
            justify="center"
          >
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
                <Lottie
                  animationData={searchAnimation}
                  autoplay={false}
                  loop={false}
                  style={{ width: 32, height: 32 }}
                />
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  showSearch ? "w-44 lg:w-52 opacity-100" : "w-0 opacity-0"
                }`}
              >
                <Input
                  className="w-full text-base md:text-lg"
                  placeholder="Tìm kiếm..."
                  size="md"
                />
              </div>

              <Button
                className="bg-[#39BDCC] text-white font-semibold text-base md:text-lg hover:bg-[#2ca6b5] ml-2 px-4 py-2"
                size="md"
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
