// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API1_URL || 'https://haianhteethbe-production.up.railway.app';

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
  // Import store dynamically to avoid circular dependencies
  const { store } = await import('../store/index');
  const state = store.getState();
  const token = state.auth.token;
  
  if (!token) {
    throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.');
  }

  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Export auth API
export { authApi } from './auth';
// Export appointment API
export { appointmentApi } from './appointment';
// Export payment API
export { paymentApi } from './payment';
// Export availableSlot API
export { availableSlotApi } from './availableSlot';

// Export types

// Lấy kiểu User từ auth.ts và thêm thuộc tính _id
import type { User } from './auth';
export type AuthUser = User & { _id: string };

export type { RegisterData, LoginData, ForgotPasswordData, ResetPasswordData, AuthResponse } from './auth';
export type { AppointmentCreationData } from './appointment';
export type { PaymentInfo, AppointmentInfo, CheckPaymentStatusResponse } from './payment';
export type { GetAvailableSlotsParams, AvailableSlotsData } from './availableSlot';
export { serviceApi } from './service';
export type { Service } from './service'; // THÊM DÒNG NÀY
export { availableDoctorApi } from "./availableDoctor";
export type { AvailableDoctor } from "./availableDoctor";
export { generateByDateApi } from "./generateByDate";
export type { GeneratedSlot } from "./generateByDate";
