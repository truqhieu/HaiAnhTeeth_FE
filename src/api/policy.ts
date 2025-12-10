import { apiCall, authenticatedApiCall, ApiResponse } from "./client";

export interface Policy {
  _id: string;
  title: string;
  description: string;
  active: boolean;
  status: "Active" | "Inactive" | "Draft";
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyData {
  title: string;
  description: string;
  active?: boolean;
  status?: "Active" | "Inactive" | "Draft";
}

export interface UpdatePolicyData {
  title?: string;
  description?: string;
  active?: boolean;
  status?: "Active" | "Inactive" | "Draft";
}

export interface PolicyResponse extends ApiResponse {
  data?: Policy | Policy[];
}

export const policyApi = {
  /**
   * Lấy danh sách policies đang active (public)
   */
  getActivePolicies: async (): Promise<PolicyResponse> => {
    return await apiCall("/policies");
  },

  /**
   * Lấy tất cả policies (cần auth)
   */
  getAllPolicies: async (): Promise<PolicyResponse> => {
    return await authenticatedApiCall("/policies/all");
  },

  /**
   * Tạo policy mới
   */
  createPolicy: async (data: CreatePolicyData): Promise<PolicyResponse> => {
    return await authenticatedApiCall("/policies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Cập nhật policy
   */
  updatePolicy: async (
    id: string,
    data: UpdatePolicyData
  ): Promise<PolicyResponse> => {
    return await authenticatedApiCall(`/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Xóa policy
   */
  deletePolicy: async (id: string): Promise<PolicyResponse> => {
    return await authenticatedApiCall(`/policies/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Lấy danh sách tiêu đề chính sách
   */
  listTitle: async (): Promise<PolicyResponse> => {
    return await authenticatedApiCall("/policies/title");
  },
};
