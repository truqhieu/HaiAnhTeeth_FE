// src/contexts/BookingModalContext.tsx

import React, { createContext, useContext, useState } from "react";
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

  // Hàm để các component khác (như Navbar) gọi để MỞ modal
  const openBookingModal = () => {
    // Kiểm tra đăng nhập trước khi mở modal
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập để đặt lịch khám!", {
        duration: 3000,
        position: "top-center",
        icon: "🔒",
      });
      
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
    // Fallback mềm để tránh crash UI nếu thiếu Provider ở một nhánh.
    console.warn("useBookingModal: Provider is missing. Using fallback no-op.");
    return {
      openBookingModal: () => {
        // Không hiển thị lỗi gây hiểu nhầm cho người dùng; ghi log nhẹ nhàng
        console.warn("openBookingModal called without BookingModalProvider. No-op.");
      },
    };
  }

  return context;
};