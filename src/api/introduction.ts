import { apiCall, authenticatedApiCall, ApiResponse } from "./index";

export interface Introduction {
  _id: string;
  title: string;
  summary: string;
  thumbnailUrl: string;
  status: "Published" | "Hidden";
  createdAt: string;
  updatedAt: string;
}

export interface GetIntroductionsParams {
  page?: number;
  limit?: number;
  status?: "Published" | "Hidden";
  search?: string;
  sort?: "asc" | "desc";
}

export interface IntroductionListResponse {
  success: boolean;
  message?: string;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: Introduction[];
}

export interface IntroductionDetailResponse {
  success: boolean;
  message?: string;
  data: Introduction | null;
}

export interface CreateIntroductionData {
  title: string;
  summary: string;
  status: "Published" | "Hidden";
  thumbnailFile: File;
}

export interface UpdateIntroductionData {
  title?: string;
  summary?: string;
  status?: "Published" | "Hidden";
  thumbnailFile?: File | null;
}

const normalizeListResponse = (result: any): IntroductionListResponse => {
  const payload = result?.data ?? result;

  return {
    success: result?.success ?? true,
    message: result?.message,
    total: payload?.total ?? 0,
    totalPages: payload?.totalPages ?? 1,
    page: payload?.page ?? 1,
    limit: payload?.limit ?? payload?.data?.length ?? 0,
    data: payload?.data ?? [],
  };
};

const normalizeDetailResponse = (result: any): IntroductionDetailResponse => ({
  success: result?.success ?? true,
  message: result?.message,
  data: (result?.data as Introduction) ?? result ?? null,
});

const buildQueryString = (params?: GetIntroductionsParams) => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.sort) queryParams.append("sort", params.sort);

  return queryParams.toString();
};

export const introductionApi = {
  // Public
  getPublicIntroductions: async (
    params?: GetIntroductionsParams,
  ): Promise<IntroductionListResponse> => {
    const queryString = buildQueryString(params);
    const endpoint = `/manager/introductions${queryString ? `?${queryString}` : ""}`;
    const result = await apiCall(endpoint, { method: "GET" });
    return normalizeListResponse(result);
  },

  getPublicIntroductionDetail: async (
    id: string,
  ): Promise<IntroductionDetailResponse> => {
    const result = await apiCall(`/manager/introductions/${id}`, {
      method: "GET",
    });
    return normalizeDetailResponse(result);
  },

  // Manager
  getAllIntroductions: async (
    params?: GetIntroductionsParams,
  ): Promise<IntroductionListResponse> => {
    const queryString = buildQueryString(params);
    const endpoint = `/manager/introductions${queryString ? `?${queryString}` : ""}${queryString ? "&" : "?"}t=${Date.now()}`;
    const result = await authenticatedApiCall(endpoint, {
      method: "GET",
    });
    return normalizeListResponse(result);
  },

  getIntroductionDetail: async (
    id: string,
  ): Promise<IntroductionDetailResponse> => {
    const result = await authenticatedApiCall(`/manager/introductions/${id}`, {
      method: "GET",
    });
    return normalizeDetailResponse(result);
  },

  createIntroduction: async (
    data: CreateIntroductionData,
  ): Promise<ApiResponse<Introduction>> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("summary", data.summary);
    formData.append("status", data.status);
    formData.append("thumbnailUrl", data.thumbnailFile);

    // Ưu tiên cookie (credentials: "include"); nếu có token thì gửi kèm.
    const token = sessionStorage.getItem("authToken");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}/manager/introductions`,
      {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tạo giới thiệu");
    }

    return response.json();
  },

  updateIntroduction: async (
    id: string,
    data: UpdateIntroductionData,
  ): Promise<ApiResponse<Introduction>> => {
    const formData = new FormData();

    if (data.title !== undefined) formData.append("title", data.title);
    if (data.summary !== undefined) formData.append("summary", data.summary);
    if (data.status !== undefined) formData.append("status", data.status);
    if (data.thumbnailFile instanceof File) {
      formData.append("thumbnailUrl", data.thumbnailFile);
    }

    // Ưu tiên cookie; nếu có token thì gửi kèm.
    const token = sessionStorage.getItem("authToken");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}/manager/introductions/${id}`,
      {
        method: "PATCH",
        headers,
        body: formData,
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể cập nhật giới thiệu");
    }

    return response.json();
  },

  deleteIntroduction: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return authenticatedApiCall(`/manager/introductions/${id}`, {
      method: "DELETE",
    });
  },
};

