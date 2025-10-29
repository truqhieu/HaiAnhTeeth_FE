import type { ApiResponse } from "./index";

import { authenticatedApiCall } from "./index";

export interface Complaint {
  _id: string;
  patientUserId: {
    _id: string;
    fullName: string;
    phone: string;
  };
  appointmentId: {
    _id: string;
    checkInAt?: string;
  };
  title: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected";
  managerResponses: Array<{
    managerUserId: string;
    responseText: string;
    respondedAt: string;
  }>;
  resolvedByManagerId?: {
    _id: string;
    fullName: string;
  };
  resolutionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintListResponse {
  status: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: Complaint[];
}

export interface ComplaintDetailResponse {
  status: boolean;
  message: string;
  data: Complaint;
}

export interface HandleComplaintRequest {
  status: "Approved" | "Rejected";
  responseText: string;
}

export const complaintApi = {
  // Tạo khiếu nại mới (Patient only)
  createComplaint: async (data: {
    title: string;
    description: string;
    appointmentId: string;
  }): Promise<ApiResponse<{ status: boolean; message: string; data: Complaint }>> => {
    return authenticatedApiCall("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Lấy danh sách khiếu nại của tôi (Patient only)
  // Note: Backend cần thêm filter theo patientUserId khi role là Patient
  getMyComplaints: async (): Promise<ApiResponse<ComplaintListResponse>> => {
    return authenticatedApiCall("/complaints?limit=100", {
      method: "GET",
    });
  },

  // Lấy danh sách tất cả khiếu nại (Manager only)
  getAllComplaints: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<ComplaintListResponse>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const url = `/complaints${queryString ? `?${queryString}` : ""}`;

    return authenticatedApiCall(url, {
      method: "GET",
    });
  },

  // Xem chi tiết khiếu nại (Manager only)
  viewDetailComplaint: async (
    complaintId: string,
  ): Promise<ApiResponse<ComplaintDetailResponse>> => {
    return authenticatedApiCall(`/complaints/${complaintId}`, {
      method: "GET",
    });
  },

  // Xử lý khiếu nại - duyệt hoặc từ chối (Manager only)
  handleComplaint: async (
    complaintId: string,
    data: HandleComplaintRequest,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall(`/complaints/${complaintId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Xóa khiếu nại (Patient only - không dùng cho Manager)
  deleteComplaint: async (
    complaintId: string,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall(`/complaints/${complaintId}`, {
      method: "DELETE",
    });
  },
};
