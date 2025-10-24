import { authenticatedApiCall, ApiResponse } from "./index";
// Types for Payment API
export interface PaymentInfo {
  _id: string;
  appointmentId: string;
  amount: number;
  status: "Pending" | "Completed" | "Failed" | "Cancelled" | "Expired"; // ⭐ Thêm Expired
  method: string;
  transactionId?: string;
  // ... các trường khác nếu có
}

export interface AppointmentInfo {
  _id: string;
  status: "PendingPayment" | "Confirmed" | "Cancelled";
  // ... các trường khác
}

export interface CheckPaymentStatusResponse {
  payment: PaymentInfo;
  appointment?: AppointmentInfo; // Optional vì khi expired có thể không có
  confirmed: boolean;
  expired: boolean; // ⭐ Thêm flag expired
}

// Payment API Functions
export const paymentApi = {
  /**
   * Kiểm tra trạng thái thanh toán.
   * API này sẽ tự động xác nhận thanh toán nếu tìm thấy giao dịch hợp lệ.
   * @param paymentId - ID của thanh toán cần kiểm tra
   */
  checkPaymentStatus: async (
    paymentId: string,
  ): Promise<ApiResponse<CheckPaymentStatusResponse>> => {
    return authenticatedApiCall<CheckPaymentStatusResponse>(
      `/payments/${paymentId}/check`,
      {
        method: "GET",
      },
    );
  },
};
