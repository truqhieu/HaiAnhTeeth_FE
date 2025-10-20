// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9999/api';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
}

// Generic API call function
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error: any) {
    throw new Error(error.message || 'Lỗi kết nối đến server');
  }
};

// Authenticated API call function
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.');
  }

  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Export auth API
export { authApi } from './auth';

// Export types
export type { RegisterData, LoginData, ForgotPasswordData, ResetPasswordData, User as AuthUser, AuthResponse } from './auth';