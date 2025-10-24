// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://haianhteethbe-production.up.railway.app/api";

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
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log("🚀 Fetching:", url);

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log("📡 Response status:", response.status, response.statusText);

    const result = await response.json();

    console.log("📦 Response body:", result);

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`,
      );
    }

    return result;
  } catch (error: any) {
    console.error("💥 API Call Error:", error);
    throw new Error(error.message || "Lỗi kết nối đến server");
  }
};

// Authenticated API call function
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  // Import store dynamically to avoid circular dependencies
  const { store } = await import("../store/index");
  const state = store.getState();
  const token = state.auth.token;

  console.log("🔐 Auth check - Token exists?", !!token);

  if (!token) {
    console.error("❌ No token found in localStorage");
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  console.log("✅ Token found, adding to headers");

  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

// Export auth API
export { authApi } from "./auth";
// Export appointment API
export { appointmentApi } from "./appointment";
// Export payment API
export { paymentApi } from "./payment";
// Export availableSlot API
export { availableSlotApi } from "./availableSlot";

// Export admin API
export { adminApi } from "./admin";

// Export manager API
export { managerApi } from "./manager";

// Export types

// Lấy kiểu User từ auth.ts và thêm thuộc tính _id
import type { User } from "./auth";
export type AuthUser = User & { _id: string };

export type {
  RegisterData,
  LoginData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
} from "./auth";
export type { AppointmentCreationData } from "./appointment";
export type {
  PaymentInfo,
  AppointmentInfo,
  CheckPaymentStatusResponse,
} from "./payment";
export type {
  GetAvailableSlotsParams,
  AvailableSlotsData,
} from "./availableSlot";
export { serviceApi } from "./service";
export type { Service } from "./service";
export { availableDoctorApi } from "./availableDoctor";
export type { AvailableDoctor } from "./availableDoctor";
export { generateByDateApi } from "./generateByDate";
export type { GeneratedSlot } from "./generateByDate";
export type {
  AdminUser,
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
  GetAccountsParams,
  GetAccountsResponse,
} from "./admin";
export type {
  ManagerService,
  CreateServiceData,
  UpdateServiceData,
  GetServicesParams,
  GetServicesResponse,
  ManagerClinic,
  ManagerDoctor,
  CreateClinicData,
  UpdateClinicData,
  GetClinicsParams,
  GetClinicsResponse,
  ManagerSchedule,
  CreateScheduleData,
  UpdateScheduleData,
  GetSchedulesParams,
  GetSchedulesResponse,
} from "./manager";
export { doctorApi } from "./doctor";
export type {
  DoctorAppointment,
  AppointmentDetail,
  PatientDetail,
} from "./doctor";
