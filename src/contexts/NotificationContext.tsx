import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { notificationApi } from "@/api/notification";
import toast from "react-hot-toast";

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
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Helper function to convert time difference to Vietnamese string
  const getTimeAgo = (sentAt: string): string => {
    const now = new Date();
    const sent = new Date(sentAt);
    const diffMs = now.getTime() - sent.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  // Generate link based on user role and appointmentId
  const generateLink = (appointmentId: string | null | undefined, userRole: string): string | undefined => {
    if (!appointmentId) return undefined;

    const roleRoutes: Record<string, string> = {
      'Patient': '/patient/appointments',
      'Staff': '/staff/dashboard', // Staff dashboard includes AllAppointments
      'Doctor': '/doctor/schedule', // Doctor schedule shows appointments
      'Nurse': '/nurse/schedule', // Nurse schedule shows appointments
      'Manager': '/manager/schedules', // Manager can view schedules
      'Admin': '/admin/accounts', // Admin doesn't have appointments view
    };

    return roleRoutes[userRole];
  };

  // Fetch notifications from API
  const refreshNotifications = async () => {
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 Fetching notifications from API...');
      
      const response = await notificationApi.getAll(1, 50); // Get first 50 notifications

      if (response.success && response.data) {
        const formattedNotifications: Notification[] = response.data.data.map((noti: any) => {
          // Generate link based on appointmentId and user role
          // Ignore link from backend if it's an API endpoint
          let finalLink: string | undefined = undefined;
          
          if (noti.appointmentId) {
            // Always use frontend route for appointments
            finalLink = generateLink(noti.appointmentId, user.role);
          } else if (noti.link && !noti.link.includes('/api/')) {
            // Only use backend link if it's NOT an API endpoint
            finalLink = noti.link;
          }

          return {
            id: noti.id,
            title: noti.title,
            message: noti.message,
            time: getTimeAgo(noti.sentAt),
            isRead: noti.isRead,
            link: finalLink,
            type: 'info' as const, // Default type
            createdAt: new Date(noti.sentAt),
          };
        });

        setNotifications(formattedNotifications);
        console.log(`✅ Loaded ${formattedNotifications.length} notifications`);
      } else {
        console.warn('⚠️ No notifications data from API');
        setNotifications([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching notifications:', error);
      // Don't show toast error to avoid annoying users
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ⭐ Tối ưu: Gộp 2 useEffect thành 1 để tránh gọi API 2 lần khi user thay đổi
  // Load notifications from API when user changes và auto-refresh
  useEffect(() => {
    if (!user) {
      console.log('⚠️ No user, clearing notifications');
      setNotifications([]);
      return;
    }

    // Gọi API ngay lập tức khi user thay đổi
    console.log('🔄 User detected, fetching notifications from API...');
    refreshNotifications();

    // ⭐ Tăng interval từ 30s lên 60s để giảm tần suất gọi API
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing notifications...');
      refreshNotifications();
    }, 60000); // Tăng từ 30s lên 60s để giảm tần suất

    return () => clearInterval(interval);
    // ⭐ Loại bỏ refreshNotifications khỏi dependencies để tránh re-run không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );

      // Call API
      const response = await notificationApi.markAsRead(id);
      
      if (!response.success) {
        // Revert on failure
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, isRead: false } : notif
          )
        );
        toast.error('Không thể đánh dấu đã đọc');
      }
    } catch (error: any) {
      console.error('❌ Error marking as read:', error);
      // Revert on error
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: false } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      const previousNotifications = [...notifications];
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );

      // Call API
      const response = await notificationApi.markAllAsRead();
      
      if (!response.success) {
        // Revert on failure
        setNotifications(previousNotifications);
        toast.error('Không thể đánh dấu tất cả đã đọc');
      } else {
        toast.success('Đã đánh dấu tất cả đã đọc');
      }
    } catch (error: any) {
      console.error('❌ Error marking all as read:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Optimistic update
      const previousNotifications = [...notifications];
      setNotifications(prev => prev.filter(notif => notif.id !== id));

      // Call API
      const response = await notificationApi.delete(id);
      
      if (!response.success) {
        // Revert on failure
        setNotifications(previousNotifications);
        toast.error('Không thể xóa thông báo');
      }
    } catch (error: any) {
      console.error('❌ Error deleting notification:', error);
      // Revert on error
      const previousNotifications = [...notifications];
      setNotifications(previousNotifications);
    }
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
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications
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

