import type { ApiResponse } from "./index";

import { authenticatedApiCall } from "./index";

export interface LeaveRequest {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  startDate: string;
  endDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedByManager?: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestListResponse {
  status: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: LeaveRequest[];
}

export interface CreateLeaveRequestData {
  startDate: string;
  endDate: string;
  reason: string;
}

export const leaveRequestApi = {
  // Tạo đơn xin nghỉ (Doctor, Nurse, Staff)
  createLeaveRequest: async (
    data: CreateLeaveRequestData,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: LeaveRequest }>
  > => {
    return authenticatedApiCall("/leave-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Lấy danh sách tất cả đơn xin nghỉ (Manager)
  getAllLeaveRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<LeaveRequestListResponse>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const url = `/leave-requests${queryString ? `?${queryString}` : ""}`;

    return authenticatedApiCall(url, {
      method: "GET",
    });
  },

  // Xử lý đơn xin nghỉ - Duyệt/Từ chối (Manager)
  handleLeaveRequest: async (
    requestId: string,
    status: "Approved" | "Rejected",
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: LeaveRequest }>
  > => {
    return authenticatedApiCall(`/leave-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

