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
    return authenticatedApiCall("/appointments/review", {
      method: "POST",
      body: JSON.stringify({ appointmentId, action, cancelReason }),
    });
  },

  /**
   * Cập nhật trạng thái ca khám (Staff check-in bệnh nhân, cập nhật trạng thái)
   * PUT /api/appointments/:appointmentId/status
   * Body: { status: 'CheckedIn' | 'Completed' | 'Cancelled' }
   */
  updateAppointmentStatus: async (
    appointmentId: string,
    status: "CheckedIn" | "Completed" | "Cancelled",
  ): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
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
};
