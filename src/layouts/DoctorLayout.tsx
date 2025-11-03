
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  DocumentTextIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Mock unread chat count - sẽ thay thế bằng API call sau
  const unreadChatCount = 3;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay cho mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Bác sĩ</span>
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
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="relative mr-3">
                    <Icon className="w-5 h-5" />
                    {(item as any).badge && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button - fixed bottom */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="mb-3 px-4">
            <p className="text-xs text-gray-500 mb-1">Đang đăng nhập</p>
            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.fullName || user?.email || "Doctor"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Bác sĩ</span>
          </div>
        </div>

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
