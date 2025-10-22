// src/contexts/BookingModalContext.tsx

import React, { createContext, useContext, useState } from 'react';
import BookingModal from '../components/Patient/BookingModal'

interface BookingModalContextType {
  openBookingModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(undefined);

export const BookingModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Hàm để các component khác (như Navbar) gọi để MỞ modal
  const openBookingModal = () => setIsBookingOpen(true);

  // Hàm để ĐÓNG modal đặt lịch (khi nhấn Hủy hoặc backdrop)
  const closeBookingModal = () => setIsBookingOpen(false);

  return (
    <BookingModalContext.Provider value={{ openBookingModal }}>
      {children} 
      
      {/* Render BookingModal
        Được điều khiển bởi state nội bộ của Provider này.
        Khi đặt lịch thành công, nó sẽ navigate tới payment page.
      */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={closeBookingModal}
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