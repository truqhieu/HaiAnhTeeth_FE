import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserIcon,
  Bars3Icon,
  XMarkIcon,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State cho số lượng pending complaints và leave requests
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const [pendingLeaveRequestsCount, setPendingLeaveRequestsCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Fetch pending counts khi component mount
  useEffect(() => {
    fetchPendingCounts();
    
    // Refresh mỗi 30 giây
    const interval = setInterval(() => {
      fetchPendingCounts();
    }, 30000);

    return () => clearInterval(interval);
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
      name: "Quản lý tin tức",
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
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          role="button"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Manager</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => handleNavigation(item.href)}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className="w-5 h-5" />
                    {(item as any).badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </div>
                  <span className="flex-1 text-left whitespace-nowrap">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.fullName || user?.email || "Manager"}
            </p>
          </div>
          <button
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            onClick={handleLogout}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Manager</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default ManagerLayout;
