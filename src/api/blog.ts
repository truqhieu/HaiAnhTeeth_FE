import { apiCall, authenticatedApiCall, ApiResponse } from "./index";

// Blog Interface
export interface Blog {
  _id: string;
  title: string;
  category: "News" | "Health Tips" | "Medical Services" | "Promotions" | "Patient Stories" | "Recruitment";
  content: string;
  thumbnailUrl: string;
  authorUserId?: {
    _id: string;
    name: string;
    email: string;
  };
  status: "Published" | "Hidden";
  startDate?: string; // Ngày bắt đầu (cho blog category "Promotions")
  endDate?: string; // Ngày kết thúc (cho blog category "Promotions")
  createdAt: string;
  updatedAt: string;
}

// Create Blog Data
export interface CreateBlogData {
  title: string;
  category: string;
  content: string;
  status: string;
  thumbnailFile?: File;
  startDate?: string; // Ngày bắt đầu (cho blog category "Promotions")
  endDate?: string; // Ngày kết thúc (cho blog category "Promotions")
}

// Update Blog Data
export interface UpdateBlogData {
  title?: string;
  category?: string;
  content?: string;
  status?: string;
  thumbnailFile?: File;
  startDate?: string; // Ngày bắt đầu (cho blog category "Promotions")
  endDate?: string; // Ngày kết thúc (cho blog category "Promotions")
}

// Get Blogs Params
export interface GetBlogsParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: "asc" | "desc";
}

// Get Blogs Response
export interface GetBlogsResponse {
  status: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: Blog[];
}

// Blog API Functions
export const blogApi = {
  // ========== PUBLIC APIs (for guests/patients) ==========
  
  // Get published blogs (no authentication required)
  getPublicBlogs: async (params?: GetBlogsParams): Promise<GetBlogsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = `/manager/blogs${queryString ? `?${queryString}` : ""}`;

    try {
      const result = await apiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetBlogsResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get published blog detail (no authentication required)
  getPublicBlogDetail: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Blog }>> => {
    return apiCall<{
      success: boolean;
      message: string;
      data: Blog;
    }>(`/manager/blogs/${id}`, {
      method: "GET",
    });
  },

  // ========== MANAGER APIs (authentication required) ==========
  
  // Get all blogs with pagination and filters
  getAllBlogs: async (params?: GetBlogsParams): Promise<GetBlogsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = `/manager/blogs${queryString ? `?${queryString}` : ""}${queryString ? "&" : "?"}t=${Date.now()}`;

    try {
      const result = await authenticatedApiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetBlogsResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get blog detail by ID
  getBlogDetail: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Blog }>> => {
    return authenticatedApiCall<{
      success: boolean;
      message: string;
      data: Blog;
    }>(`/manager/blogs/${id}`, {
      method: "GET",
    });
  },

  // Create new blog
  createBlog: async (
    data: CreateBlogData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Blog }>> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("category", data.category);
    formData.append("content", data.content);
    formData.append("status", data.status);
    
    if (data.thumbnailFile) {
      formData.append("thumbnailUrl", data.thumbnailFile);
    }

    // Thêm startDate và endDate nếu có
    if (data.startDate) {
      formData.append("startDate", data.startDate);
    }
    if (data.endDate) {
      formData.append("endDate", data.endDate);
    }

    // For FormData, we need to manually handle the request
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}/manager/blogs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Lỗi khi tạo blog");
    }

    return response.json();
  },

  // Update blog
  updateBlog: async (
    id: string,
    data: UpdateBlogData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Blog }>> => {
    const formData = new FormData();
    
    if (data.title !== undefined) formData.append("title", data.title);
    if (data.category !== undefined) formData.append("category", data.category);
    if (data.content !== undefined) formData.append("content", data.content);
    if (data.status !== undefined) formData.append("status", data.status);
    
    if (data.thumbnailFile) {
      formData.append("thumbnailUrl", data.thumbnailFile);
    }

    // Thêm startDate và endDate nếu có (hoặc null để xóa)
    if (data.startDate !== undefined) {
      formData.append("startDate", data.startDate || "");
    }
    if (data.endDate !== undefined) {
      formData.append("endDate", data.endDate || "");
    }

    // For FormData, we need to manually handle the request
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}/manager/blogs/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Lỗi khi cập nhật blog");
    }

    return response.json();
  },

  // Delete blog
  deleteBlog: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return authenticatedApiCall<{ success: boolean; message: string }>(
      `/manager/blogs/${id}`,
      {
        method: "DELETE",
      },
    );
  },
};

