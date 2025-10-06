import React, { useState } from "react";
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
import searchAnimation from "../icons/search.json";
import { useAuthModal } from "@/contexts/AuthModalContext";

const AppNavbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const { openLoginModal, openSignupModal } = useAuthModal();

  return (
    <header className="w-full shadow bg-white">
      {/* Top bar */}
      <div className="bg-[#39BDCC] text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-2">
          {/* Left side */}
          <div className="flex items-center space-x-6">
            <a href="tel:02473008866" className="flex items-center space-x-2">
              <PhoneIcon className="w-4 h-4" />
              <span>Hỗ trợ tư vấn: 024 7300 8866</span>
            </a>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <a
              href="/offers"
              className="bg-[#39BDCC] hover:bg-green-500 px-3 py-1 rounded text-white text-xs"
            >
              Ưu đãi nổi bật
            </a>
            <select
              name="language"
              className="bg-transparent text-white uppercase text-sm"
            >
              <option value="vi">VI</option>
              <option value="en">EN</option>
              <option value="kr">KR</option>
              <option value="cn">CN</option>
            </select>
            <Button
              variant="light"
              size="sm"
              className="text-white hover:text-gray-200 min-w-unit-0 p-2"
              onPress={openSignupModal}
            >
              Đăng ký
            </Button>
            <Button
              variant="light"
              size="sm"
              className="text-white hover:text-gray-200 min-w-unit-0 p-2"
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
          <Link href="/" className="flex items-center">
            <img
              src="/Screenshot_2025-09-19_141436-removebg-preview.png"
              alt="Logo"
              className="h-20 w-auto object-contain"
            />
            <img
              src="/Screenshot_2025-09-19_141449-removebg-preview.png"
              alt="Logo Text"
              className="h-12 w-auto object-contain ml-2"
            />
          </Link>
        </div>

        {/* Navbar Items + Search */}
        <Navbar className="flex-1">
          {/* Menu Items ở giữa */}
          <NavbarContent className="hidden sm:flex gap-6" justify="center">
            <NavbarItem>
              <Link href="/about" color="foreground">
                Giới thiệu
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/services" color="foreground">
                Dịch vụ
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/doctors" color="foreground">
                Danh sách bác sĩ
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/departments" color="foreground">
                Chuyên khoa
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/news" color="foreground">
                Tin tức & Ưu đãi
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/contact" color="foreground">
                Liên hệ
              </Link>
            </NavbarItem>
          </NavbarContent>

          {/* Search */}
          <NavbarContent justify="end">
            <NavbarItem className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <Lottie
                  animationData={searchAnimation}
                  loop={false}
                  autoplay={false}
                  style={{ width: 32, height: 32 }}
                />
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  showSearch ? "w-48 opacity-100" : "w-0 opacity-0"
                }`}
              >
                <Input placeholder="Tìm kiếm..." size="sm" className="w-full" />
              </div>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      </div>
    </header>
  );
};

export default AppNavbar;
