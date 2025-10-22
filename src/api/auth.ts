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
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  gender: string;
  phoneNumber: string; // THÊM DÒNG NÀY
  dob: string;
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
    const response = await apiCall<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Save token and user to localStorage
    if (response.success && response.data) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
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

  // Logout (clear localStorage)
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },
};
