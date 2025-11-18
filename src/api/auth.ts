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
    data: UpdateProfileData,
  ): Promise<ApiResponse<{ user: User }>> => {
    const response = await authenticatedApiCall<{ user: User }>(
      "/auth/profile",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    // Update user in localStorage if successful
    if (response.success && response.data) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
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

  // Logout (clear localStorage)
  logout: (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("authTimestamp");
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("user");

    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem("authToken");
  },

  // Check if user is authenticated and token is not expired
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("authToken");
    const timestamp = localStorage.getItem("authTimestamp");
    
    if (!token || !timestamp) {
      return false;
    }
    
    // Check if token is expired (24 hours = 86400000 ms)
    const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    const isExpired = (Date.now() - parseInt(timestamp)) > TOKEN_EXPIRY_MS;
    
    if (isExpired) {
      // Clear expired token
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("authTimestamp");
      return false;
    }
    
    return true;
  },

  // getProfile: async (): Promise<ApiResponse<User>> => {
  //   return authenticatedApiCall<User>('/api/auth/profile', { // Thêm /api
  //     method: 'GET',
  //   });
  // },
};
