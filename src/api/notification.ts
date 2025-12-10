import { authenticatedApiCall, ApiResponse } from "./client";

export interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  sentAt: string;
  appointmentId: string | null;
  leaveRequestId?: string | null;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  pages: number;
}

export const notificationApi = {
  /**
   * Lấy danh sách thông báo của user
   * GET /api/notifications/all?page=1&limit=10
   */
  getAll: async (page: number = 1, limit: number = 10): Promise<ApiResponse<NotificationListResponse>> => {
    return authenticatedApiCall(`/notifications/all?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  /**
   * Đánh dấu thông báo đã đọc
   * PUT /api/notifications/:id
   */
  markAsRead: async (notificationId: string): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/notifications/${notificationId}`, {
      method: "PUT",
    });
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   * PUT /api/notifications/all
   */
  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/notifications/all`, {
      method: "PUT",
    });
  },

  /**
   * Xóa thông báo
   * DELETE /api/notifications/:id
   */
  delete: async (notificationId: string): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};

