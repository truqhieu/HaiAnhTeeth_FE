import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { chatApi } from "@/api/chat";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  // Unread chat count for doctor
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Check quyền truy cập
  useEffect(() => {
    if (isAuthenticated && user) {
      const normalizedRole = user.role?.toLowerCase();
      if (normalizedRole !== "doctor") {
        navigate("/unauthorized");
      }
    } else if (!isAuthenticated && location.pathname.startsWith("/doctor/")) {
      // Nếu không authenticated và đang ở trang doctor, redirect về home
      navigate("/");
    }
  }, [user, isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const res = await chatApi.getConversations();
        // BE may return either { success, data } or { data: [...] }
        const convs = (res as any)?.data || [];
        if (isMounted && Array.isArray(convs)) {
          const totalUnread = convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
          setUnreadChatCount(totalUnread);
        }
      } catch {
        // ignore
        if (isMounted) setUnreadChatCount(0);
      }
    };

    fetchUnread();
    // ⭐ Tăng interval từ 30s lên 60s để giảm tần suất gọi API
    const interval = setInterval(fetchUnread, 60000); // Tăng từ 30s lên 60s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    // Redirect về home trước khi logout để tránh redirect đến unauthorized
    navigate("/");
    logout();
  };

  const profilePath = "/doctor/profile";

  const navigation = [
    {
      name: "Lịch khám",
      href: "/doctor/schedule",
      icon: CalendarIcon,
      current: location.pathname === "/doctor/schedule",
    },
    {
      name: "Chat với bệnh nhân",
      href: "/doctor/chat",
      icon: ChatBubbleLeftRightIcon,
      current: location.pathname === "/doctor/chat",
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
    },
    {
      name: "Đơn xin nghỉ phép",
      href: "/doctor/leave-requests",
      icon: DocumentTextIcon,
      current: location.pathname === "/doctor/leave-requests",
    },
    {
      name: "Thông báo",
      href: "/doctor/notifications",
      icon: BellIcon,
      current: location.pathname === "/doctor/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - luôn hiển thị */}
      <div className="w-16 sm:w-48 md:w-56 lg:w-64 bg-white shadow-lg lg:sticky lg:top-0 lg:h-screen flex flex-col flex-shrink-0 transition-all duration-300">
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-3 sm:px-4 md:px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center w-full space-x-2 sm:space-x-3">
            <Avatar
              className="w-8 h-8 sm:w-10 sm:h-10 border border-blue-100 flex-shrink-0"
              name={user?.fullName || "Doctor"}
              src={user?.avatar}
            />
            <div className="hidden sm:block min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Bác sĩ</p>
              <span className="text-sm sm:text-lg font-semibold text-gray-800 truncate block">
                {user?.fullName || "Chưa xác định"}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-2 sm:px-3 md:px-4 py-4 sm:py-6 overflow-y-auto min-h-0">
          <div className="space-y-1 sm:space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center justify-center sm:justify-start px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={item.name}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                    {(item as any).badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <span className="hidden sm:inline ml-2 sm:ml-3 truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Profile & Logout Section - Fixed at bottom */}
        <div className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-t border-gray-200 space-y-1 sm:space-y-2 flex-shrink-0 bg-white">
          <button
            className="w-full flex items-center justify-center sm:justify-start px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            onClick={() => handleNavigation(profilePath)}
            title="Hồ sơ cá nhân"
          >
            <UserCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline ml-2 sm:ml-3">Hồ sơ cá nhân</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center sm:justify-start px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Đăng xuất"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline ml-2 sm:ml-3">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DoctorLayout;
// =======
// import React from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Button } from "@heroui/react";
// import {
//   CalendarIcon,
//   ArrowRightOnRectangleIcon,
//   UserCircleIcon,
// } from "@heroicons/react/24/outline";

// import { useAuth } from "@/contexts/AuthContext";

// const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Top Navbar */}
//       <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
//         <div className="container mx-auto px-4">
//           <div className="flex items-center justify-between h-16">
//             {/* Logo */}
//             <Link className="flex items-center space-x-3" to="/doctor/schedule">
//               <img
//                 alt="Logo"
//                 className="h-10 w-auto object-contain"
//                 src="/logo2.png"
//               />
//               <div>
//                 <h1 className="text-xl font-bold text-gray-800">
//                   Bác sĩ - {user?.fullName || "Doctor"}
//                 </h1>
//                 <p className="text-xs text-gray-500">Quản lý lịch khám</p>
//               </div>
//             </Link>

//             {/* User Info & Logout */}
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-2 text-sm">
//                 <UserCircleIcon className="w-5 h-5 text-gray-600" />
//                 <span className="text-gray-700 font-medium">
//                   {user?.fullName || "Doctor"}
//                 </span>
//               </div>
//               <Button
//                 color="danger"
//                 size="sm"
//                 startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
//                 variant="flat"
//                 onPress={handleLogout}
//               >
//                 Đăng xuất
//               </Button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Sidebar + Content */}
//       <div className="flex">
//         {/* Sidebar */}
//         <aside className="w-64 bg-white shadow-sm border-r min-h-[calc(100vh-4rem)] sticky top-16">
//           <nav className="p-4">
//             <ul className="space-y-2">
//               <li>
//                 <Link
//                   className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600"
//                   to="/doctor/schedule"
//                 >
//                   <CalendarIcon className="w-5 h-5" />
//                   <span className="font-medium">Lịch khám</span>
//                 </Link>
//               </li>
//             </ul>
//           </nav>
//         </aside>

//         {/* Main Content */}
//         <main className="flex-1 p-6">{children}</main>
//       </div>
//     </div>
//   );
// };

// export default DoctorLayout;
// >>>>>>> cddc0357b506625871baa03428dc7d24237b0181
