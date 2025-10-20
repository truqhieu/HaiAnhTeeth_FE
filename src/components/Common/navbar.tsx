import { useState } from "react";
import { PhoneIcon } from "@heroicons/react/24/outline";
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Link,
  Input,
  Button,
} from "@heroui/react";
import Lottie from "lottie-react";

import searchAnimation from "./search.json";

import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAuth } from "@/contexts/AuthContext";
import PatientHeader from "../Patient/PatientHeader";

const AppNavbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const { openLoginModal, openSignupModal } = useAuthModal();
  const { isAuthenticated, user } = useAuth();

  // Nếu user đã login và là Patient, hiển thị PatientHeader
  if (isAuthenticated && user?.role === "Patient") {
    return <PatientHeader />;
  }

  // Nếu chưa login hoặc không phải Patient, hiển thị navbar thông thường

  return (
    <header className="w-full shadow bg-white">
      {/* Top bar */}
      <div className="bg-[#39BDCC] text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-2">
          {/* Left side */}
          <div className="flex items-center space-x-6">
            <a className="flex items-center space-x-2" href="tel:02473008866">
              <PhoneIcon className="w-4 h-4" />
              <span>Hỗ trợ tư vấn: 024 7300 8866</span>
            </a>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <a
              className="bg-[#39BDCC] hover:bg-green-500 px-3 py-1 rounded text-white text-xs"
              href="/offers"
            >
              Ưu đãi nổi bật
            </a>
            <select
              className="bg-transparent text-white uppercase text-sm"
              name="language"
            >
              <option value="vi">VI</option>
              <option value="en">EN</option>
              <option value="kr">KR</option>
              <option value="cn">CN</option>
            </select>
            <Button
              className="text-white hover:text-gray-200 min-w-unit-0 p-2"
              size="sm"
              variant="light"
              onPress={openSignupModal}
            >
              Đăng ký
            </Button>
            <Button
              className="text-white hover:text-gray-200 min-w-unit-0 p-2"
              size="sm"
              variant="light"
              onPress={openLoginModal}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
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
                size="sm">
                Để lại thông tin tư vấn
              </Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      </div>
    </header>
  );
};

export default AppNavbar;
