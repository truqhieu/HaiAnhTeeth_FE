import { useNavigate } from "react-router-dom";
import { PhoneIcon } from "@heroicons/react/24/outline";
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@heroui/react";

import PatientHeader from "../Patient/PatientHeader";

import { useAuth } from "@/contexts/AuthContext";

const AppNavbar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Ensure role check is case-insensitive because BE returns lowercase (e.g., "patient")
  const normalizedRole = user?.role?.toLowerCase();
  if (isAuthenticated && normalizedRole === "patient") {
    return <PatientHeader />;
  }

  return (
    <header className="w-full shadow bg-white text-base md:text-lg">
      {/* Top bar - Cleaner design with better spacing */}
      <div className="bg-[#39BDCC] text-white text-base md:text-lg font-semibold tracking-wide py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Left: Support hotline */}
          <a
            className="flex items-center space-x-2 hover:text-gray-100 transition-colors"
            href="tel:02473008866"
          >
            <PhoneIcon className="w-5 h-5" />
            <span>Hỗ trợ tư vấn: 024 7300 8866</span>
          </a>

          {/* Right: Auth buttons */}
          <div className="flex items-center space-x-4">
            <Button
              className="text-white hover:bg-white/10 font-semibold text-base md:text-lg transition-colors"
              size="sm"
              variant="light"
              onPress={() => navigate("/signup")}
            >
              Đăng ký
            </Button>
            <Button
              className="bg-white text-[#39BDCC] hover:bg-gray-100 font-semibold text-base md:text-lg transition-colors"
              size="sm"
              onPress={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navbar - Improved spacing and alignment */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24 lg:h-28">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link className="flex items-center" href="/">
              <img
                alt="Logo"
                className="h-16 lg:h-20 w-auto object-contain"
                src="/logo1.png"
              />
              <img
                alt="Logo Text"
                className="h-12 lg:h-14 w-auto object-contain ml-3"
                src="/logo2.png"
              />
            </Link>
          </div>

          {/* Navigation Items - Center */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-12">
            {[
              { label: "Giới thiệu", href: "/about" },
              { label: "Dịch vụ", href: "/services" },
              { label: "Tin tức & Ưu đãi", href: "/news" },
            ].map((item) => (
              <Link
                key={item.href}
                className="font-semibold text-gray-800 hover:text-[#39BDCC] transition-colors text-lg lg:text-xl"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="flex-shrink-0">
            <Button
              className="bg-[#39BDCC] text-white font-semibold text-base lg:text-lg hover:bg-[#2ca6b5] px-5 lg:px-6 py-2 shadow-md hover:shadow-lg transition-all"
              size="lg"
              onClick={() => navigate("/consultation")}
            >
              Để lại thông tin tư vấn
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
