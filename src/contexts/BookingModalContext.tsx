// src/contexts/BookingModalContext.tsx

import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import BookingModal from "../components/Patient/BookingModal";
import { useAuth } from "./AuthContext";

interface BookingModalContextType {
  openBookingModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(
  undefined,
);

export const BookingModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Hàm để các component khác (như Navbar) gọi để MỞ modal
  const openBookingModal = () => {
    // Kiểm tra đăng nhập trước khi mở modal
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập để đặt lịch khám!", {
        duration: 2000,
        position: "top-center",
        icon: "🔒",
      });
      
      // Redirect đến trang login sau 2 giây
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
      return;
    }
    
    setIsBookingOpen(true);
  };

  // Hàm để ĐÓNG modal đặt lịch (khi nhấn Hủy hoặc backdrop)
  const closeBookingModal = () => setIsBookingOpen(false);

  return (
    <BookingModalContext.Provider value={{ openBookingModal }}>
      {children}

      {/* Render BookingModal
        Được điều khiển bởi state nội bộ của Provider này.
        Khi đặt lịch thành công, nó sẽ navigate tới payment page.
      */}
      <BookingModal isOpen={isBookingOpen} onClose={closeBookingModal} />
    </BookingModalContext.Provider>
  );
};

// Hook tùy chỉnh để component con dễ dàng gọi modal
export const useBookingModal = () => {
  const context = useContext(BookingModalContext);

  if (!context) {
    throw new Error(
      "useBookingModal phải được dùng bên trong BookingModalProvider",
    );
  }

  return context;
};