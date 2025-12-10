import { apiCall, authenticatedApiCall, ApiResponse } from "./client";

// Promotion Interface
export interface Promotion {
  _id: string;
  title: string;
  description: string;
  discountType: "Percent" | "Fix";
  discountValue: number;
  applyToAll: boolean;
  applicableServices?: string[]; // Deprecated - use services instead
  services?: any[]; // Backend returns this field with populated service data
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Active" | "Expired";
  createdAt?: string;
  updatedAt?: string;
}

// Create Promotion Data
export interface CreatePromotionData {
  title: string;
  description: string;
  discountType: "Percent" | "Fix";
  discountValue: number;
  applyToAll: boolean;
  applicableServices?: string[];
  startDate: string;
  endDate: string;
}

// Update Promotion Data
export interface UpdatePromotionData {
  title?: string;
  description?: string;
  discountType?: "Percent" | "Fixed";
  discountValue?: number;
  applyToAll?: boolean;
  applicableServices?: string[];
  startDate?: string;
  endDate?: string;
}

// Get Promotions Params
export interface GetPromotionsParams {
  page?: number;
  limit?: number;
  status?: string;
  discountType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: "asc" | "desc";
}

// Get Promotions Response
export interface GetPromotionsResponse {
  success: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: Promotion[];
}

// Promotion API Functions
export const promotionApi = {
  // ========== PUBLIC APIs (for guests/patients) ==========
  
  // Get active promotions (no authentication required)
  getPublicPromotions: async (
    params?: GetPromotionsParams,
  ): Promise<GetPromotionsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.discountType) queryParams.append("discountType", params.discountType);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = `/promotions${queryString ? `?${queryString}` : ""}`;

    try {
      const result = await apiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetPromotionsResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get promotion detail (no authentication required)
  getPublicPromotionDetail: async (
    id: string,
  ): Promise<
    ApiResponse<{ success: boolean; message: string; data: Promotion }>
  > => {
    return apiCall<{
      success: boolean;
      message: string;
      data: Promotion;
    }>(`/promotions/${id}`, {
      method: "GET",
    });
  },

  // ========== MANAGER APIs (authentication required) ==========
  
  // Get all promotions with pagination and filters
  getAllPromotions: async (
    params?: GetPromotionsParams,
  ): Promise<GetPromotionsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.discountType) queryParams.append("discountType", params.discountType);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = `/manager/promotions${queryString ? `?${queryString}` : ""}${queryString ? "&" : "?"}t=${Date.now()}`;

    try {
      const result = await authenticatedApiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetPromotionsResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get promotion detail by ID
  getPromotionDetail: async (
    id: string,
  ): Promise<
    ApiResponse<{ success: boolean; message: string; data: Promotion }>
  > => {
    return authenticatedApiCall<{
      success: boolean;
      message: string;
      data: Promotion;
    }>(`/manager/promotions/${id}`, {
      method: "GET",
    });
  },

  // Create new promotion
  createPromotion: async (
    data: CreatePromotionData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Promotion }>> => {
    return authenticatedApiCall<{
      success: boolean;
      message: string;
      data: Promotion;
    }>("/manager/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update promotion
  updatePromotion: async (
    id: string,
    data: UpdatePromotionData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Promotion }>> => {
    return authenticatedApiCall<{
      success: boolean;
      message: string;
      data: Promotion;
    }>(`/manager/promotions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Delete promotion
  deletePromotion: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return authenticatedApiCall<{ success: boolean; message: string }>(
      `/manager/promotions/${id}`,
      {
        method: "DELETE",
      },
    );
  },
};

