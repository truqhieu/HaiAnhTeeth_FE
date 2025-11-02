import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const loadMockNotifications = () => {
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    console.log('🔍 Loading mock notifications for role:', user.role);

    const mockData: Notification[] = [];
    
    // Mock notifications based on role (case-insensitive)
    const userRole = user.role?.toLowerCase();
    
    if (userRole === 'patient') {
      mockData.push(
        {
          id: '1',
          title: 'Lịch hẹn được duyệt ✅',
          message: 'Lịch hẹn khám răng của bạn vào ngày 15/01/2025 lúc 9:00 AM đã được phê duyệt. Vui lòng đến đúng giờ.',
          time: '5 phút trước',
          isRead: false,
          link: '/patient/appointments',
          type: 'success',
          createdAt: new Date(Date.now() - 5 * 60000)
        },
        {
          id: '2',
          title: 'Thanh toán thành công 💰',
          message: 'Thanh toán 500.000đ cho dịch vụ Tư vấn nha khoa đã được xác nhận. Mã giao dịch: #TXN123456',
          time: '1 giờ trước',
          isRead: false,
          link: '/patient/appointments',
          type: 'success',
          createdAt: new Date(Date.now() - 60 * 60000)
        },
        {
          id: '3',
          title: 'Nhắc nhở lịch hẹn ⏰',
          message: 'Bạn có lịch hẹn vào ngày mai lúc 9:00 AM với BS. Nguyễn Văn A tại Phòng khám số 1',
          time: '3 giờ trước',
          isRead: true,
          link: '/patient/appointments',
          type: 'info',
          createdAt: new Date(Date.now() - 3 * 3600000)
        },
        {
          id: '4',
          title: 'Yêu cầu đổi lịch được chấp nhận',
          message: 'Yêu cầu đổi lịch hẹn từ 14:00 sang 16:00 đã được phê duyệt',
          time: '5 giờ trước',
          isRead: true,
          link: '/patient/appointments',
          type: 'success',
          createdAt: new Date(Date.now() - 5 * 3600000)
        },
        {
          id: '5',
          title: 'Kết quả khám đã sẵn sàng',
          message: 'Kết quả khám răng của bạn đã được cập nhật. Xem chi tiết trong hồ sơ bệnh án.',
          time: '1 ngày trước',
          isRead: true,
          link: '/patient/medical-records',
          type: 'info',
          createdAt: new Date(Date.now() - 24 * 3600000)
        },
        {
          id: '6',
          title: 'Cảnh báo: Lịch hẹn sắp đến hạn',
          message: 'Lịch hẹn tái khám của bạn sẽ diễn ra sau 3 ngày nữa',
          time: '2 ngày trước',
          isRead: true,
          link: '/patient/appointments',
          type: 'warning',
          createdAt: new Date(Date.now() - 2 * 24 * 3600000)
        }
      );
    } else if (userRole === 'doctor') {
      mockData.push(
        {
          id: '1',
          title: 'Lịch hẹn mới 📅',
          message: 'Bệnh nhân Nguyễn Thị B đã đặt lịch khám răng vào 10:00 AM ngày mai. Dịch vụ: Khám tổng quát',
          time: '10 phút trước',
          isRead: false,
          link: '/doctor/schedule',
          type: 'info',
          createdAt: new Date(Date.now() - 10 * 60000)
        },
        {
          id: '2',
          title: 'Yêu cầu đổi lịch ⚠️',
          message: 'Bệnh nhân Trần Văn C yêu cầu đổi lịch từ 14:00 sang 16:00 ngày 16/01/2025',
          time: '30 phút trước',
          isRead: false,
          link: '/doctor/schedule',
          type: 'warning',
          createdAt: new Date(Date.now() - 30 * 60000)
        },
        {
          id: '3',
          title: 'Hồ sơ bệnh án cần cập nhật',
          message: 'Có 2 hồ sơ bệnh án sau khám chưa được cập nhật kết quả',
          time: '2 giờ trước',
          isRead: false,
          link: '/doctor/schedule',
          type: 'warning',
          createdAt: new Date(Date.now() - 2 * 3600000)
        },
        {
          id: '4',
          title: 'Lịch làm việc tuần tới',
          message: 'Lịch làm việc tuần 02-09/01/2025 đã được cập nhật. Vui lòng xem chi tiết.',
          time: '5 giờ trước',
          isRead: true,
          link: '/doctor/schedule',
          type: 'info',
          createdAt: new Date(Date.now() - 5 * 3600000)
        },
        {
          id: '5',
          title: 'Bệnh nhân hủy lịch',
          message: 'Bệnh nhân Lê Thị D đã hủy lịch hẹn ngày 14/01/2025 lúc 15:00',
          time: '1 ngày trước',
          isRead: true,
          link: '/doctor/schedule',
          type: 'error',
          createdAt: new Date(Date.now() - 24 * 3600000)
        }
      );
    } else if (userRole === 'staff') {
      mockData.push(
        {
          id: '1',
          title: 'Lịch hẹn cần duyệt ⏳',
          message: 'Có 3 lịch hẹn mới đang chờ phê duyệt. Vui lòng xem xét sớm.',
          time: '15 phút trước',
          isRead: false,
          link: '/staff/dashboard',
          type: 'warning',
          createdAt: new Date(Date.now() - 15 * 60000)
        },
        {
          id: '2',
          title: 'Thanh toán chờ xác nhận 💳',
          message: 'Có 2 giao dịch thanh toán đang chờ xác nhận. Tổng: 1.200.000đ',
          time: '1 giờ trước',
          isRead: false,
          link: '/staff/dashboard',
          type: 'info',
          createdAt: new Date(Date.now() - 60 * 60000)
        },
        {
          id: '3',
          title: 'Yêu cầu đổi bác sĩ',
          message: 'Bệnh nhân Nguyễn Văn A yêu cầu đổi từ BS. X sang BS. Y',
          time: '3 giờ trước',
          isRead: false,
          link: '/staff/patient-requests',
          type: 'warning',
          createdAt: new Date(Date.now() - 3 * 3600000)
        },
        {
          id: '4',
          title: 'Check-in thành công',
          message: 'Bệnh nhân Phạm Thị E đã check-in cho lịch 11:00 AM',
          time: '4 giờ trước',
          isRead: true,
          link: '/staff/dashboard',
          type: 'success',
          createdAt: new Date(Date.now() - 4 * 3600000)
        },
        {
          id: '5',
          title: 'Lịch hẹn quá hạn thanh toán',
          message: '1 lịch hẹn tư vấn đã quá hạn thanh toán và bị hủy tự động',
          time: '1 ngày trước',
          isRead: true,
          link: '/staff/dashboard',
          type: 'error',
          createdAt: new Date(Date.now() - 24 * 3600000)
        }
      );
    } else if (userRole === 'manager') {
      mockData.push(
        {
          id: '1',
          title: 'Đơn xin nghỉ mới 📝',
          message: 'BS. Trần Văn C đã gửi đơn xin nghỉ phép từ 20-22/01/2025 (3 ngày)',
          time: '20 phút trước',
          isRead: false,
          link: '/manager/leave-requests',
          type: 'warning',
          createdAt: new Date(Date.now() - 20 * 60000)
        },
        {
          id: '2',
          title: 'Khiếu nại mới ❗',
          message: 'Bệnh nhân gửi khiếu nại về chất lượng dịch vụ tại Phòng khám số 2. Mức độ: Cao',
          time: '2 giờ trước',
          isRead: false,
          link: '/manager/complaints',
          type: 'error',
          createdAt: new Date(Date.now() - 2 * 3600000)
        },
        {
          id: '3',
          title: 'Thiết bị cần bảo trì',
          message: 'Máy X-quang tại Phòng 3 cần được bảo trì định kỳ trong tuần này',
          time: '5 giờ trước',
          isRead: false,
          link: '/manager/devices',
          type: 'warning',
          createdAt: new Date(Date.now() - 5 * 3600000)
        },
        {
          id: '4',
          title: 'Báo cáo tháng 📊',
          message: 'Báo cáo thống kê tháng 12 đã sẵn sàng. Doanh thu: 150 triệu đồng',
          time: '1 ngày trước',
          isRead: true,
          link: '/manager/services',
          type: 'info',
          createdAt: new Date(Date.now() - 24 * 3600000)
        },
        {
          id: '5',
          title: 'Đơn nghỉ phép được duyệt',
          message: 'Đã phê duyệt đơn xin nghỉ của Điều dưỡng Lê Thị F',
          time: '2 ngày trước',
          isRead: true,
          link: '/manager/leave-requests',
          type: 'success',
          createdAt: new Date(Date.now() - 2 * 24 * 3600000)
        },
        {
          id: '6',
          title: 'Ưu đãi mới cần duyệt',
          message: 'Chương trình ưu đãi "Khuyến mãi Tết" đang chờ phê duyệt',
          time: '3 ngày trước',
          isRead: true,
          link: '/manager/promotions',
          type: 'info',
          createdAt: new Date(Date.now() - 3 * 24 * 3600000)
        },
        {
          id: '7',
          title: 'Khiếu nại đã xử lý',
          message: 'Khiếu nại #C001 đã được giải quyết và đóng',
          time: '4 ngày trước',
          isRead: true,
          link: '/manager/complaints',
          type: 'success',
          createdAt: new Date(Date.now() - 4 * 24 * 3600000)
        }
      );
    } else if (userRole === 'nurse') {
      mockData.push(
        {
          id: '1',
          title: 'Bệnh nhân check-in ✅',
          message: 'Bệnh nhân Lê Thị D đã check-in cho lịch 10:30 AM. Phòng: 2',
          time: '5 phút trước',
          isRead: false,
          link: '/nurse/schedule',
          type: 'info',
          createdAt: new Date(Date.now() - 5 * 60000)
        },
        {
          id: '2',
          title: 'Lịch hẹn sắp đến',
          message: 'Có 3 bệnh nhân sẽ đến khám trong 30 phút tới',
          time: '30 phút trước',
          isRead: false,
          link: '/nurse/schedule',
          type: 'warning',
          createdAt: new Date(Date.now() - 30 * 60000)
        },
        {
          id: '3',
          title: 'Hồ sơ bệnh án cần cập nhật',
          message: 'Bệnh nhân Nguyễn Văn G cần cập nhật thông tin sau khám',
          time: '2 giờ trước',
          isRead: false,
          link: '/nurse/schedule',
          type: 'warning',
          createdAt: new Date(Date.now() - 2 * 3600000)
        },
        {
          id: '4',
          title: 'Lịch làm việc cập nhật',
          message: 'Lịch làm việc của bạn đã được cập nhật cho tuần tới',
          time: '1 ngày trước',
          isRead: true,
          link: '/nurse/schedule',
          type: 'info',
          createdAt: new Date(Date.now() - 24 * 3600000)
        }
      );
    } else {
      console.log('⚠️ Unknown role:', user.role);
      // Default notifications for unknown roles
      mockData.push(
        {
          id: '1',
          title: 'Chào mừng! 👋',
          message: 'Chào mừng bạn đến với hệ thống HaiAnhTeeth',
          time: 'Vừa xong',
          isRead: false,
          link: '/',
          type: 'info',
          createdAt: new Date()
        }
      );
    }

    console.log('✅ Mock data created:', mockData.length, 'notifications');
    setNotifications(mockData);
  };

  // Load mock data when user changes
  useEffect(() => {
    if (user) {
      console.log('🔄 User detected, loading mock notifications...');
      loadMockNotifications();
    } else {
      console.log('⚠️ No user, clearing notifications');
      setNotifications([]);
    }
  }, [user]);

  // Save notifications to localStorage whenever they change (optional)
  useEffect(() => {
    if (user && notifications.length > 0) {
      localStorage.setItem(`notifications_${user._id || user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`notifications_${user._id || user.id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

