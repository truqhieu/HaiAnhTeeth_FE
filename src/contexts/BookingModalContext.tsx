// src/contexts/BookingModalContext.tsx

import React, { createContext, useContext, useState } from 'react';
// Đảm bảo đường dẫn này đúng với vị trí file của bạn
import BookingConsultation from '../components/Patient/BookingConsultation'; 
import PaymentModal from '../components/Patient/PaymentModal'; // File bạn vừa tạo ở bước trước

interface BookingModalContextType {
  openBookingModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(undefined);

export const BookingModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Hàm để các component khác (như Navbar) gọi để MỞ modal
  const openBookingModal = () => setIsBookingOpen(true);

  // Hàm để ĐÓNG modal đặt lịch (khi nhấn Hủy hoặc backdrop)
  const closeBookingModal = () => setIsBookingOpen(false);

  // Hàm để XỬ LÝ KHI ĐẶT LỊCH THÀNH CÔNG
  const handleBookingSuccess = () => {
    setIsBookingOpen(false); // 1. Đóng modal đặt lịch
    setIsPaymentOpen(true); // 2. Mở modal thanh toán
  };

  // Hàm để ĐÓNG modal thanh toán (hết giờ hoặc nhấn Hủy)
  const closePaymentModal = () => {
    setIsPaymentOpen(false);
    // Bạn có thể alert ở đây nếu muốn
    // alert('Giao dịch đã bị hủy hoặc hết hạn.'); 
  };

  return (
    <BookingModalContext.Provider value={{ openBookingModal }}>
      {children} 
      
      {/* Render cả 2 modal ở đây. 
        Chúng được điều khiển bởi state nội bộ của Provider này.
      */}
      <BookingConsultation
        isOpen={isBookingOpen}
        onClose={closeBookingModal}
        onBookingSuccess={handleBookingSuccess} 
      />
      
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={closePaymentModal}
      />
    </BookingModalContext.Provider>
  );
};

// Hook tùy chỉnh để component con dễ dàng gọi modal
export const useBookingModal = () => {
  const context = useContext(BookingModalContext);
  if (!context) {
    throw new Error('useBookingModal phải được dùng bên trong BookingModalProvider');
  }
  return context;
};