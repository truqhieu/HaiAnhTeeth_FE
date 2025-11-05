import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { Button, Select, SelectItem } from "@heroui/react";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll, isLoading, refreshNotifications } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">✅</div>;
      case 'warning':
        return <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">⚠️</div>;
      case 'error':
        return <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">❌</div>;
      default:
        return <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📢</div>;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return notifDate.toLocaleDateString("vi-VN");
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BellIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đã đọc"}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button
                color="primary"
                variant="flat"
                startContent={<CheckIcon className="w-4 h-4" />}
                onPress={markAllAsRead}
              >
                Đánh dấu tất cả
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Lọc:</span>
            </div>
            <Select
              className="w-48"
              selectedKeys={[filter]}
              size="sm"
              variant="bordered"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as "all" | "unread" | "read";
                setFilter(selected);
              }}
            >
              <SelectItem key="all">Tất cả</SelectItem>
              <SelectItem key="unread">Chưa đọc</SelectItem>
              <SelectItem key="read">Đã đọc</SelectItem>
            </Select>
            
            {notifications.length > 0 && (
              <Button
                color="danger"
                variant="light"
                size="sm"
                startContent={<TrashIcon className="w-4 h-4" />}
                onPress={() => {
                  if (window.confirm("Bạn có chắc muốn xóa tất cả thông báo?")) {
                    clearAll();
                  }
                }}
              >
                Xóa tất cả
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải thông báo...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === "unread" 
                  ? "Không có thông báo chưa đọc" 
                  : filter === "read"
                  ? "Không có thông báo đã đọc"
                  : "Không có thông báo nào"}
              </h3>
              <p className="text-gray-500">
                Các thông báo mới sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${
                  !notification.isRead ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className={`text-lg font-semibold text-gray-900 ${
                          !notification.isRead ? "font-bold" : ""
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Mới
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                          {formatDate(notification.createdAt)}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {notification.link && (
                            <Button
                              color="primary"
                              size="sm"
                              variant="flat"
                              onPress={() => handleNotificationClick(notification)}
                            >
                              Xem chi tiết
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button
                              color="default"
                              size="sm"
                              variant="light"
                              startContent={<CheckIcon className="w-4 h-4" />}
                              onPress={() => markAsRead(notification.id)}
                            >
                              Đánh dấu đã đọc
                            </Button>
                          )}
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => {
                              if (window.confirm("Bạn có chắc muốn xóa thông báo này?")) {
                                deleteNotification(notification.id);
                              }
                            }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;


