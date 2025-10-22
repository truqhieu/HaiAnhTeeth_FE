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
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🚀 Fetching:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📦 Response body:', result);

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error: any) {
    console.error('💥 API Call Error:', error);
    throw new Error(error.message || 'Lỗi kết nối đến server');
  }
};

// Authenticated API call function
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('authToken');
  
  console.log('🔐 Auth check - Token exists?', !!token);
  
  if (!token) {
    console.error('❌ No token found in localStorage');
    throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.');
  }

  console.log('✅ Token found, adding to headers');

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

// Export admin API
export { adminApi } from './admin';

// Export manager API
export { managerApi } from './manager';

// Export types
export type { RegisterData, LoginData, ForgotPasswordData, ResetPasswordData, UpdateProfileData, User as AuthUser, AuthResponse } from './auth';
export type { AdminUser, CreateUserData, UpdateUserData, ChangePasswordData, GetAccountsParams, GetAccountsResponse } from './admin';
export type { ManagerService, CreateServiceData, UpdateServiceData, GetServicesParams, GetServicesResponse, ManagerClinic, ManagerDoctor, CreateClinicData, UpdateClinicData, GetClinicsParams, GetClinicsResponse } from './manager';