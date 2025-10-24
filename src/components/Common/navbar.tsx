import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

import PatientHeader from "../Patient/PatientHeader";

import searchAnimation from "./search.json";

import { useAuth } from "@/contexts/AuthContext";

const AppNavbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user?.role === "Patient") {
    return <PatientHeader />;
  }

  return (
    <header className="w-full shadow bg-white text-base md:text-lg">
      {/* Top bar */}
      <div className="bg-[#39BDCC] text-white text-base md:text-lg font-semibold tracking-wide">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center py-3">
          {/* Left side */}
          <div className="flex items-center space-x-6">
            <a
              className="flex items-center space-x-2 hover:text-gray-100"
              href="tel:02473008866"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>Hỗ trợ tư vấn: 024 7300 8866</span>
            </a>
          </div>

          {/* Right side */}
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

            {/* 🔹 Thay vì mở modal → chuyển trang */}
            <Button
              className="text-white hover:text-gray-200 font-semibold text-base md:text-lg min-w-unit-0 p-3"
              size="md"
              variant="light"
              onPress={() => navigate("/signup")}
            >
              Đăng ký
            </Button>
            <Button
              className="text-white hover:text-gray-200 font-semibold text-base md:text-lg min-w-unit-0 p-3"
              size="md"
              variant="light"
              onPress={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="flex items-center h-28 px-8">
        {/* Logo */}
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
                  className="font-semibold text-gray-800 hover:text-[#39BDCC] transition-colors text-lg md:text-xl"
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </NavbarItem>
            ))}
          </NavbarContent>

          {/* Search */}
          <NavbarContent className="flex items-center gap-3" justify="end">
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

export default AppNavbar;
