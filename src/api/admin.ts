import { authenticatedApiCall, ApiResponse } from "./index";

// Admin Types
export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  dob?: string;
  gender?: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export interface UpdateUserData {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dob?: string;
  gender?: string;
}

export interface ChangePasswordData {
  password: string;
}

export interface GetAccountsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  role?: string;
}

// This is the ACTUAL response structure backend returns (flat, not wrapped)
export interface GetAccountsResponse {
  status: boolean; // Backend returns 'status' directly
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: AdminUser[];
}

// Admin API Functions
export const adminApi = {
  // Get all accounts with pagination and filters
  getAllAccounts: async (
    params?: GetAccountsParams,
  ): Promise<GetAccountsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);

    const queryString = queryParams.toString();
    const endpoint = `/admin/accounts${queryString ? `?${queryString}` : ""}`;

    console.log("🌐 API Request - GET:", endpoint);
    console.log(
      "🔑 Token:",
      localStorage.getItem("authToken") ? "Present ✅" : "Missing ❌",
    );

    try {
      // Backend returns flat response, not wrapped in ApiResponse
      const result = await authenticatedApiCall<any>(endpoint, {
        method: "GET",
      });

      console.log("🌐 API Response:", result);

      // Return the response directly (it's already in the right format)
      return result as unknown as GetAccountsResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get account detail by ID
  getAccountDetail: async (
    id: string,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: AdminUser }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: AdminUser;
    }>(`/admin/accounts/${id}`, {
      method: "GET",
    });
  },

  // Create new account
  createAccount: async (
    data: CreateUserData,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall<{ status: boolean; message: string }>(
      "/admin/accounts",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  // Update account
  updateAccount: async (
    id: string,
    data: UpdateUserData,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: AdminUser }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: AdminUser;
    }>(`/admin/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Change password
  changePassword: async (
    id: string,
    data: ChangePasswordData,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall<{ status: boolean; message: string }>(
      `/admin/accounts/change-password/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  // Lock account
  lockAccount: async (
    id: string,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: AdminUser }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: AdminUser;
    }>(`/admin/accounts/lock`, {
      method: "PATCH",
      body: JSON.stringify({ selectedIds: [id] }), // ← Gửi array với 1 phần tử
    });
  },
  
  // Unlock account
  unlockAccount: async (
    id: string,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: AdminUser }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: AdminUser;
    }>(`/admin/accounts/unlock`, {
      method: "PATCH",
      body: JSON.stringify({ selectedIds: [id] }), // ← Gửi array với 1 phần tử
    });
  },

  // Assign role (swap between Doctor and Nurse)
  assignRole: async (
    id: string,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall<{ status: boolean; message: string }>(
      `/admin/accounts/assign-role/${id}`,
      {
        method: "PATCH",
      },
    );
  },
};
