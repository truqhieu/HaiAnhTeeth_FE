import { apiCall, authenticatedApiCall, ApiResponse } from "./index";

// Auth Types
export interface RegisterData {
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  email: string;
  newPassword: string;
}

export interface User {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  gender?: string;
  phoneNumber?: string;
  dob?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dob?: string;
  gender?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Auth API Functions
export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse> => {
    return apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Login user
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiResponse> => {
    return apiCall("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => {
    return apiCall("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Verify email
  verifyEmail: async (
    token: string,
    email: string,
  ): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>(
      `/auth/verify-email?token=${token}&email=${email}`,
      {
        method: "GET",
      },
    );
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return authenticatedApiCall<{ user: User }>("/auth/profile", {
      method: "GET",
    });
  },

  // Update user profile
  updateProfile: async (
    data: UpdateProfileData | FormData,
    isFormData = false,
  ): Promise<ApiResponse<{ user: User }>> => {
    if (isFormData && data instanceof FormData) {
      const token = sessionStorage.getItem("authToken");
      if (!token) throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:9999/api"}/auth/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể cập nhật hồ sơ");
      }

      const result = (await response.json()) as ApiResponse<{ user: User }>;
      if (result.success && result.data) {
        sessionStorage.setItem("user", JSON.stringify(result.data.user));
      }
      return result;
    }

    const response = await authenticatedApiCall<{ user: User }>("/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  },

  // Change password (for authenticated users)
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall<{ status: boolean; message: string }>(
      "/auth/change-password",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
  },

  // Logout (clear sessionStorage)
  logout: (): void => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
  },

  // Get current user from sessionStorage
  getCurrentUser: (): User | null => {
    const userStr = sessionStorage.getItem("user");

    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token from sessionStorage
  getToken: (): string | null => {
    return sessionStorage.getItem("authToken");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem("authToken");
  },

  // getProfile: async (): Promise<ApiResponse<User>> => {
  //   return authenticatedApiCall<User>('/api/auth/profile', { // Thêm /api
  //     method: 'GET',
  //   });
  // },
};
