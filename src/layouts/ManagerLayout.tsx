import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TagIcon,
  CpuChipIcon,
  NewspaperIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/contexts/AuthContext";
import { complaintApi } from "@/api/complaint";
import { leaveRequestApi } from "@/api/leaveRequest";

interface ManagerLayoutProps {
  children: React.ReactNode;
}

const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  
  // State cho số lượng pending complaints và leave requests
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const [pendingLeaveRequestsCount, setPendingLeaveRequestsCount] = useState(0);

  // Check quyền truy cập
  useEffect(() => {
    if (isAuthenticated && user) {
      const normalizedRole = user.role?.toLowerCase();
      if (normalizedRole !== "manager") {
        navigate("/unauthorized");
      }
    } else if (!isAuthenticated && location.pathname.startsWith("/manager/")) {
      // Nếu không authenticated và đang ở trang manager, redirect về home
      navigate("/");
    }
  }, [user, isAuthenticated, navigate, location.pathname]);

  const handleLogout = () => {
    // Redirect về home trước khi logout để tránh redirect đến unauthorized
    navigate("/");
    logout();
  };

  // Fetch pending counts khi component mount
  useEffect(() => {
    fetchPendingCounts();
    
    // ⭐ Tăng interval từ 30s lên 60s để giảm tần suất gọi API
    const interval = setInterval(() => {
      fetchPendingCounts();
    }, 60000); // Tăng từ 30s lên 60s

    return () => clearInterval(interval);
    // ⭐ Loại bỏ fetchPendingCounts khỏi dependencies để tránh re-run không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPendingCounts = async () => {
    try {
      console.log("🔍 Fetching pending counts...");
      
      // Fetch pending complaints
      const complaintsRes = await complaintApi.getAllComplaints({
        status: "Pending",
        limit: 1000, // Lấy tất cả để đếm
      });

      console.log("📋 Complaints response:", complaintsRes);

      // Check cả success và status vì backend có thể dùng field khác
      if ((complaintsRes.success || (complaintsRes as any).status) && complaintsRes.data) {
        const total = complaintsRes.data.total || (complaintsRes as any).total || 0;
        console.log("✅ Pending complaints count:", total);
        setPendingComplaintsCount(total);
      } else {
        console.log("❌ Complaints response failed or no data");
      }

      // Fetch pending leave requests
      const leaveRequestsRes = await leaveRequestApi.getAllLeaveRequests({
        status: "Pending",
        limit: 1000, // Lấy tất cả để đếm
      });

      console.log("📋 Leave requests response:", leaveRequestsRes);

      // Check cả success và status vì backend có thể dùng field khác
      if ((leaveRequestsRes.success || (leaveRequestsRes as any).status) && leaveRequestsRes.data) {
        const total = leaveRequestsRes.data.total || (leaveRequestsRes as any).total || 0;
        console.log("✅ Pending leave requests count:", total);
        setPendingLeaveRequestsCount(total);
      } else {
        console.log("❌ Leave requests response failed or no data");
      }

      console.log("🔴 Badge states:", {
        pendingComplaintsCount,
        pendingLeaveRequestsCount,
        shouldShowComplaintsBadge: pendingComplaintsCount > 0,
        shouldShowLeaveRequestsBadge: pendingLeaveRequestsCount > 0
      });
    } catch (error) {
      console.error("❌ Error fetching pending counts:", error);
    }
  };

  const navigation = [
    {
      name: "Thống kê",
      href: "/manager/dashboard",
      icon: ChartBarIcon,
      current: location.pathname === "/manager/dashboard",
    },
    {
      name: "Quản lý dịch vụ",
      href: "/manager/services",
      icon: WrenchScrewdriverIcon,
      current: location.pathname === "/manager/services",
    },
    {
      name: "Quản lý phòng khám",
      href: "/manager/rooms",
      icon: BuildingOfficeIcon,
      current: location.pathname === "/manager/rooms",
    },
    {
      name: "Quản lý lịch làm việc bác sĩ",
      href: "/manager/schedules",
      icon: CalendarDaysIcon,
      current: location.pathname === "/manager/schedules",
    },
    {
      name: "Quản lý thiết bị",
      href: "/manager/devices",
      icon: CpuChipIcon,
      current: location.pathname === "/manager/devices",
    },
    {
      name: "Quản lý khiếu nại",
      href: "/manager/complaints",
      icon: ExclamationTriangleIcon,
      current: location.pathname === "/manager/complaints",
      badge: pendingComplaintsCount > 0, // Hiển thị badge nếu có pending
    },
    {
      name: "Quản lý đơn nghỉ phép",
      href: "/manager/leave-requests",
      icon: DocumentTextIcon,
      current: location.pathname === "/manager/leave-requests",
      badge: pendingLeaveRequestsCount > 0, // Hiển thị badge nếu có pending
    },
    {
      name: "Quản lý ưu đãi",
      href: "/manager/promotions",
      icon: TagIcon,
      current: location.pathname === "/manager/promotions",
    },
    {
      name: "Quản lý bài viết",
      href: "/manager/blogs",
      icon: NewspaperIcon,
      current: location.pathname === "/manager/blogs",
    },
    {
      name: "Quản lý giới thiệu",
      href: "/manager/introductions",
      icon: InformationCircleIcon,
      current: location.pathname === "/manager/introductions",
    },
    {
      name: "Quản lý chính sách",
      href: "/manager/policies",
      icon: ClipboardDocumentListIcon,
      current: location.pathname === "/manager/policies",
    },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - luôn hiển thị */}
      <div className="w-16 sm:w-56 md:w-64 lg:w-72 bg-white shadow-lg lg:sticky lg:top-0 lg:h-screen flex flex-col flex-shrink-0 transition-all duration-300">
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-3 sm:px-4 md:px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex-shrink-0">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <span className="hidden sm:inline text-sm sm:text-lg font-semibold text-gray-800">Manager</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-2 sm:px-3 md:px-4 py-4 sm:py-6">
          <div className="space-y-1 sm:space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  className={`w-full flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => handleNavigation(item.href)}
                  title={item.name}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className="w-5 h-5" />
                    {(item as any).badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </div>
                  <span className="hidden sm:inline flex-1 text-left whitespace-nowrap">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-t border-gray-200">
          <div className="mb-2 sm:mb-3 px-2 sm:px-4">
            <p className="hidden sm:block text-xs sm:text-sm font-medium text-gray-700 truncate">
              {user?.fullName || user?.email || "Manager"}
            </p>
          </div>
          <button
            className="w-full flex items-center justify-center sm:justify-start px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline ml-2 sm:ml-3">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default ManagerLayout;
