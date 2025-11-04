import { authenticatedApiCall, ApiResponse } from "./index";

export interface AppointmentCreationData {
  fullName: string;
  email: string;
  phoneNumber: string;
  appointmentFor: "self" | "other";
  serviceId: string;
  doctorUserId: string;
  doctorScheduleId: string;
  selectedSlot: { startTime: string; endTime: string };
  notes?: string;
}

// The actual response data from the backend controller
export interface AppointmentResponseData {
  appointmentId: string;
  service: string;
  doctor: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  mode: string;
  requirePayment: boolean;
  payment?: {
    paymentId: string;
    amount: number;
    method: string;
    status: string;
    expiresAt: string;
    QRurl: string;
  };
}

export const appointmentApi = {
  create: async (
    data: AppointmentCreationData,
  ): Promise<ApiResponse<AppointmentResponseData>> => {
    return authenticatedApiCall("/appointments/consultation/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Lấy danh sách ca khám của người dùng
   * Logic mặc định:
   *   - Lấy tất cả các ca khám đã hoàn tất đặt lịch (Pending, Approved, CheckedIn, Completed, Cancelled)
   *   - Bao gồm cả đặt lịch khám (không cần thanh toán) và tư vấn đã thanh toán xong
   *   - KHÔNG bao gồm: PendingPayment (các ca tư vấn đang chờ thanh toán)
   */
  getMyAppointments: async (options?: {
    includePendingPayment?: boolean;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();

    if (options?.includePendingPayment) {
      queryParams.append("includePendingPayment", "true");
    }

    if (options?.status) {
      queryParams.append("status", options.status);
    }

    const queryString = queryParams.toString();
    const url = `/appointments/my-appointments${queryString ? `?${queryString}` : ""}`;

    return authenticatedApiCall(url, {
      method: "GET",
    });
  },

  getAllAppointments: async (): Promise<ApiResponse<any>> => {
    return authenticatedApiCall("/appointments/all", {
      method: "GET",
    });
  },

  getPendingAppointments: async (): Promise<ApiResponse<any>> => {
    return authenticatedApiCall("/appointments/pending", {
      method: "GET",
    });
  },

  reviewAppointment: async (
    appointmentId: string,
    action: "approve" | "cancel",
    cancelReason?: string,
  ): Promise<ApiResponse<any>> => {
    const payload = { appointmentId, action, cancelReason };
    console.log("🔍 [API] Review appointment payload:", payload);
    
    return authenticatedApiCall("/appointments/review", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cập nhật trạng thái ca khám (Staff check-in bệnh nhân, cập nhật trạng thái)
   * PUT /api/appointments/:appointmentId/status
   * Body: { status: 'CheckedIn' | 'Completed' | 'Cancelled' }
   */
  updateAppointmentStatus: async (
    appointmentId: string,
    status: "CheckedIn" | "InProgress" | "Completed" | "Cancelled" | "No-Show",
  ): Promise<ApiResponse<any>> => {
    const payload = { status };
    console.log("🔍 [API] Update status payload:", { appointmentId, payload });
    
    return authenticatedApiCall(`/appointments/${appointmentId}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Hủy ca khám với logic khác nhau cho Examination/Consultation
   * DELETE /api/appointments/:appointmentId/cancel
   * Body: { cancelReason?: string }
   */
  cancelAppointment: async (
    appointmentId: string,
    cancelReason?: string,
  ): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/cancel`, {
      method: "DELETE",
      body: JSON.stringify({ cancelReason }),
    });
  },

  /**
   * Xác nhận hủy lịch tư vấn (sau khi hiển thị popup policies)
   * POST /api/appointments/:appointmentId/confirm-cancel
  * Body: { confirmed: boolean, cancelReason?: string, bankInfo?: { accountHolderName: string, accountNumber: string, bankName: string } }
   */
  confirmCancelAppointment: async (
    appointmentId: string,
    confirmed: boolean,
    cancelReason?: string,
    bankInfo?: {
      accountHolderName: string;
      accountNumber: string;
      bankName: string;
    }
  ): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/confirm-cancel`, {
      method: "POST",
      body: JSON.stringify({ confirmed, cancelReason, bankInfo }),
    });
  },

  /**
   * Lấy chi tiết lịch hẹn với bank info
   * GET /api/appointments/:appointmentId/details
   */
  getAppointmentDetails: async (appointmentId: string): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/details`, {
      method: "GET",
    });
  },

  /**
   * Đánh dấu đã hoàn tiền
   * PUT /api/appointments/:appointmentId/mark-refunded
   */
  markAsRefunded: async (appointmentId: string): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/mark-refunded`, {
      method: "PUT",
    });
  },

  /**
   * Lấy khung giờ rảnh để đổi lịch theo appointmentId + ngày
   * GET /api/appointments/:appointmentId/reschedule/slots?date=YYYY-MM-DD
   */
  getRescheduleSlots: async (
    appointmentId: string,
    date: string,
  ): Promise<ApiResponse<{
    date: string;
    availableSlots: { startTime: string; endTime: string; displayTime?: string }[];
    totalSlots: number;
  }>> => {
    const query = new URLSearchParams({ date }).toString();
    return authenticatedApiCall(`/appointments/${appointmentId}/reschedule/slots?${query}`, {
      method: "GET",
    });
  },

  /**
   * Bệnh nhân gửi yêu cầu đổi lịch (chỉ đổi ngày/giờ)
   * POST /api/appointments/:appointmentId/request-reschedule
   * Body: { newStartTime: string, newEndTime: string }
   */
  requestReschedule: async (
    appointmentId: string,
    params: { newStartTime: string; newEndTime: string; reason?: string },
  ): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/request-reschedule`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * Bệnh nhân gửi yêu cầu đổi bác sĩ (chỉ đổi bác sĩ)
   * POST /api/appointments/:appointmentId/request-change-doctor
   * Body: { newDoctorUserId: string }
   */
  requestChangeDoctor: async (
    appointmentId: string,
    params: { newDoctorUserId: string; reason?: string },
  ): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/request-change-doctor`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * Lấy danh sách bác sĩ khả dụng cho thời gian cụ thể
   * GET /api/appointments/:appointmentId/available-doctors?startTime=...&endTime=...
   */
  getAvailableDoctors: async (
    appointmentId: string,
    startTime: string,
    endTime: string,
  ): Promise<ApiResponse<{
    appointmentId: string;
    currentDoctor: { _id: string; fullName: string };
    serviceName: string;
    serviceDuration: number;
    requestedStartTime: string;
    requestedEndTime: string;
    availableDoctors: Array<{
      _id: string;
      fullName: string;
      email: string;
      workingHours: any;
    }>;
    totalAvailable: number;
  }>> => {
    const query = new URLSearchParams({ startTime, endTime }).toString();
    return authenticatedApiCall(`/appointments/${appointmentId}/available-doctors?${query}`, {
      method: "GET",
    });
  },

  // Lấy danh sách tất cả bác sĩ
  getAllDoctors: async (): Promise<ApiResponse<Array<{ _id: string; fullName: string }>>> => {
    return authenticatedApiCall(`/appointments/doctors`, {
      method: "GET",
    });
  },
  
  /**
   * AI Booking - Tự động tạo lịch từ prompt người dùng
   * POST /api/appointments/ai-create
   */
  aiCreate: async (
    prompt: string,
    appointmentFor?: "self" | "other",
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<ApiResponse<{
    appointmentId: string;
    appointment: any;
    parsedInfo: any;
  }>> => {
    return authenticatedApiCall(`/appointments/ai-create`, {
      method: "POST",
      body: JSON.stringify({ prompt, appointmentFor, conversationHistory }),
    });
  },
};
