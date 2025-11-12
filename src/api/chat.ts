import { authenticatedApiCall, ApiResponse } from "./index";

export interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  specialization?: string;
  avatar?: string;
  appointmentId?: string;
  appointmentDate?: string;
}

export interface Message {
  _id: string;
  senderId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  receiverId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  appointmentId: {
    _id: string;
    appointmentDate?: string;
    status?: string;
  } | string;
  content: string;
  status: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
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

// For Doctor view
export interface DoctorConversation {
  appointmentId: string;
  appointmentDate: string;
  status: string;
  patient: {
    _id: string;
    fullName: string;
    email: string;
  };
  lastMessage: any;
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
   * BE returns: { data: { messages: [], medicalRecord: {}, appointment: {} } }
   */
  getMessages: async (appointmentId: string): Promise<ApiResponse<any>> => {
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

  // Note: Mark as read is automatically handled when fetching messages via getMessages
};

