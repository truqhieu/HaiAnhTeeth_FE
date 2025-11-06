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
    return authenticatedApiCall("/chat/patient/doctors", {
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
   * Lấy tin nhắn theo appointmentId
   */
  getMessages: async (appointmentId: string): Promise<ApiResponse<Message[]>> => {
    return authenticatedApiCall(`/chat/messages?appointmentId=${appointmentId}`, {
      method: "GET",
    });
  },

  /**
   * Gửi tin nhắn mới
   */
  sendMessage: async (data: {
    receiverId: string;
    appointmentId: string;
    content: string;
  }): Promise<ApiResponse<Message>> => {
    return authenticatedApiCall("/chat/send-message", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  markAsRead: async (appointmentId: string): Promise<ApiResponse<void>> => {
    return authenticatedApiCall(`/chat/read/${appointmentId}`, {
      method: "PUT",
    });
  },
};

