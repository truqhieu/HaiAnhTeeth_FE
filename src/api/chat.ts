import { authenticatedApiCall, ApiResponse } from "./index";

export interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  specialty?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  _id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export const chatApi = {
  /**
   * Lấy danh sách bác sĩ đã từng khám cho bệnh nhân
   * Chỉ lấy bác sĩ từ các ca khám có trạng thái Completed hoặc Finalized
   */
  getAvailableDoctors: async (): Promise<ApiResponse<Doctor[]>> => {
    return authenticatedApiCall("/chat/available-doctors", {
      method: "GET",
    });
  },

  /**
   * Lấy danh sách cuộc trò chuyện của patient
   */
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    return authenticatedApiCall("/chat/conversations", {
      method: "GET",
    });
  },

  /**
   * Lấy tin nhắn của một cuộc trò chuyện
   */
  getMessages: async (
    doctorId: string,
    limit?: number,
    before?: string
  ): Promise<ApiResponse<Message[]>> => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());
    if (before) queryParams.append("before", before);
    
    const queryString = queryParams.toString();
    const url = `/chat/messages/${doctorId}${queryString ? `?${queryString}` : ""}`;

    return authenticatedApiCall(url, {
      method: "GET",
    });
  },

  /**
   * Gửi tin nhắn mới
   */
  sendMessage: async (
    doctorId: string,
    content: string
  ): Promise<ApiResponse<Message>> => {
    return authenticatedApiCall("/chat/send", {
      method: "POST",
      body: JSON.stringify({ doctorId, content }),
    });
  },

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  markAsRead: async (doctorId: string): Promise<ApiResponse<void>> => {
    return authenticatedApiCall(`/chat/read/${doctorId}`, {
      method: "PUT",
    });
  },
};

