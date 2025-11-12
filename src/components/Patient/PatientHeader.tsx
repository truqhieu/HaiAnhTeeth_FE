import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
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
} from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/Common/NotificationBell";

const PatientHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
      {/* Top bar - Cleaner patient header with better spacing */}
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

          {/* Right: Patient actions */}
          <div className="flex items-center space-x-4">
            {/* Notification bell */}
            <div className="relative">
              <NotificationBell iconClassName="w-6 h-6 text-white" />
            </div>

            {/* User name */}
            <span className="text-white font-semibold hidden sm:inline">
              {user?.fullName || "Patient"}
            </span>

            {/* User profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                isIconOnly
                className="text-white hover:bg-white/10 transition-colors"
                variant="light"
                size="sm"
                onClick={() => setIsDropdownOpen((s) => !s)}
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl transition-all duration-200 z-50 border border-gray-100">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.fullName || "Patient"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
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
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#E0F7FA] hover:text-[#39BDCC] flex items-center cursor-pointer transition-colors duration-150"
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
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center cursor-pointer transition-colors duration-150"
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
              onClick={() => navigate("/patient/consultation")}
            >
              Để lại thông tin tư vấn
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;
