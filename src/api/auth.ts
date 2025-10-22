import { apiCall, authenticatedApiCall, ApiResponse } from './index';

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
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  gender?: string;
  phoneNumber?: string;
  dob?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Auth API Functions
export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse> => { // Thêm /api
    return apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Login user
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => { // Thêm /api
    return apiCall<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiResponse> => { // Thêm /api
    return apiCall('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => { // Thêm /api
    return apiCall('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify email
  verifyEmail: async (token: string, email: string): Promise<ApiResponse<AuthResponse>> => { // Thêm /api
    return apiCall<AuthResponse>(`/api/auth/verify-email?token=${token}&email=${email}`, {
      method: 'GET',
    });
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return authenticatedApiCall<User>('/api/auth/profile', { // Thêm /api
      method: 'GET',
    });
  },
};
