import { authenticatedApiCall, ApiResponse } from "./index";

export interface Policy {
  _id: string;
  title: string;
  description: string;
  active: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const policyApi = {
  /**
   * Lấy tất cả policies đang hoạt động (public API)
   * GET /api/policies
   */
  getActivePolicies: async (): Promise<ApiResponse<Policy[]>> => {
    return authenticatedApiCall("/policies", {
      method: "GET",
    });
  },

  /**
   * Lấy tất cả policies (bao gồm cả inactive) - cần authentication
   * GET /api/policies/all
   */
  getAllPolicies: async (): Promise<ApiResponse<Policy[]>> => {
    return authenticatedApiCall("/policies/all", {
      method: "GET",
    });
  },

  /**
   * Tạo policy mới - cần authentication
   * POST /api/policies
   */
  createPolicy: async (data: {
    title: string;
    description: string;
    active?: boolean;
    status?: string;
  }): Promise<ApiResponse<Policy>> => {
    return authenticatedApiCall("/policies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Cập nhật policy - cần authentication
   * PUT /api/policies/:id
   */
  updatePolicy: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      active?: boolean;
      status?: string;
    }
  ): Promise<ApiResponse<Policy>> => {
    return authenticatedApiCall(`/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Xóa policy - cần authentication
   * DELETE /api/policies/:id
   */
  deletePolicy: async (id: string): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/policies/${id}`, {
      method: "DELETE",
    });
  },
};
